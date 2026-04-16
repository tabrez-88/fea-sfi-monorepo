import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import {
  AuthResponseDto,
  AuthUserDto,
  ForgotPasswordResponseDto,
  LoginDto,
  MessageResponseDto,
  RegisterDto,
  ResetPasswordDto,
} from '../dto';
import type { AuthenticatedUser } from '../types/jwt-payload';

import { EmailService } from './email.service';
import { PasswordService } from './password.service';
import { TokenService, type RefreshContext } from './token.service';

const FORGOT_PASSWORD_MESSAGE =
  'If an account with that email exists, a password reset link has been sent.';
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly tokens: TokenService,
    private readonly email: EmailService,
    private readonly auditLog: AuditLogService,
    private readonly config: ConfigService,
  ) {}

  // ─── register ────────────────────────────────────────────────────────────

  async register(dto: RegisterDto, ctx: RefreshContext = {}): Promise<AuthResponseDto> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new ConflictException('An account with that email already exists');
    }

    const passwordHash = await this.password.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        name: dto.fullName.trim(),
        passwordHash,
      },
    });

    const tokens = await this.tokens.issueTokensForUser(user, ctx);

    await this.auditLog.create({
      actor: user.id,
      action: 'CREATED',
      entityType: 'User',
      entityId: user.id,
      metadata: { email: user.email, name: user.name },
    });

    return { user: toAuthUser(user), tokens };
  }

  // ─── login ───────────────────────────────────────────────────────────────

  async login(dto: LoginDto, ctx: RefreshContext = {}): Promise<AuthResponseDto> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Constant-time-ish: still hash the password so attackers can't time-distinguish missing accounts.
      await this.password.compare(dto.password, '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidi');
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await this.password.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.tokens.issueTokensForUser(user, ctx);

    await this.auditLog.create({
      actor: user.id,
      action: 'LOGGED_IN',
      entityType: 'User',
      entityId: user.id,
      metadata: { ipAddress: ctx.ipAddress, userAgent: ctx.userAgent },
    });

    return { user: toAuthUser(user), tokens };
  }

  // ─── refresh ─────────────────────────────────────────────────────────────

  async refresh(refreshToken: string, ctx: RefreshContext = {}): Promise<AuthResponseDto> {
    const issued = await this.tokens.rotateRefreshToken(refreshToken, ctx);

    // Resolve user fresh — role/email may have changed since the original refresh token issuance
    const userId = await this.userIdFromRefreshToken(issued.accessToken);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return { user: toAuthUser(user), tokens: issued };
  }

  // ─── logout ──────────────────────────────────────────────────────────────

  async logout(refreshToken: string): Promise<MessageResponseDto> {
    await this.tokens.revokeRefreshToken(refreshToken);
    return { message: 'Logged out successfully.' };
  }

  // ─── forgot password (idempotent) ────────────────────────────────────────

  async forgotPassword(email: string): Promise<ForgotPasswordResponseDto> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Constant-response: always return success even when the email is unknown.
    if (!user) {
      return { message: FORGOT_PASSWORD_MESSAGE, email: normalizedEmail };
    }

    // Idempotency: invalidate every outstanding (unused, unexpired) token for this user
    // before issuing a fresh one. This handles the FE "Resend" button cleanly.
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const { token, tokenHash } = this.tokens.generatePasswordResetToken();
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    });

    await this.email.sendPasswordResetEmail(user.email, token);

    await this.auditLog.create({
      actor: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'User',
      entityId: user.id,
    });

    return { message: FORGOT_PASSWORD_MESSAGE, email: normalizedEmail };
  }

  // ─── reset password ──────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto): Promise<MessageResponseDto> {
    const tokenHash = this.tokens.hashPasswordResetToken(dto.token);
    const stored = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    if (stored.usedAt) {
      throw new UnauthorizedException('Reset token has already been used');
    }
    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Reset token has expired');
    }

    const newHash = await this.password.hash(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { passwordHash: newHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Revoke all refresh tokens — every other session must re-authenticate.
    await this.tokens.revokeAllRefreshTokensForUser(stored.userId);

    await this.auditLog.create({
      actor: stored.userId,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'User',
      entityId: stored.userId,
    });

    return { message: 'Password updated successfully.' };
  }

  // ─── me ──────────────────────────────────────────────────────────────────

  async me(authUser: AuthenticatedUser): Promise<AuthUserDto> {
    const user = await this.prisma.user.findUnique({ where: { id: authUser.id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return toAuthUser(user);
  }

  // ─── helpers ─────────────────────────────────────────────────────────────

  private async userIdFromRefreshToken(accessToken: string): Promise<string> {
    // Decode without verifying signature — we just issued it, but use the JWT payload to extract sub.
    const [, payloadB64] = accessToken.split('.');
    if (!payloadB64) throw new UnauthorizedException('Malformed access token');
    const json = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as { sub?: string };
    if (!parsed.sub) throw new UnauthorizedException('Malformed access token');
    return parsed.sub;
  }
}

// ─── mapper ──────────────────────────────────────────────────────────────────

export function toAuthUser(user: User): AuthUserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
  };
}
