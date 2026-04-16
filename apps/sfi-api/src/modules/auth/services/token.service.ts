import * as crypto from 'crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '../types/jwt-payload';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshContext {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class TokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;
  private readonly accessExpiresInSeconds: number;
  private readonly refreshExpiresInMs: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.accessSecret = required(config, 'JWT_ACCESS_SECRET');
    this.refreshSecret = required(config, 'JWT_REFRESH_SECRET');
    this.accessExpiresIn = config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';
    this.refreshExpiresIn = config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    this.accessExpiresInSeconds = parseDurationToSeconds(this.accessExpiresIn);
    this.refreshExpiresInMs = parseDurationToSeconds(this.refreshExpiresIn) * 1000;
  }

  async issueTokensForUser(
    user: Pick<User, 'id' | 'email' | 'role'>,
    ctx: RefreshContext = {},
  ): Promise<IssuedTokens> {
    const refreshTokenId = crypto.randomUUID();

    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      jti: refreshTokenId,
      type: 'refresh',
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.accessSecret,
      expiresIn: this.accessExpiresIn,
    });
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiresIn,
    });

    await this.prisma.refreshToken.create({
      data: {
        id: refreshTokenId,
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshExpiresInMs),
        userAgent: ctx.userAgent,
        ipAddress: ctx.ipAddress,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessExpiresInSeconds,
    };
  }

  /**
   * Rotates a refresh token: validates the inbound token, revokes it, and issues a new pair.
   * If the inbound token has already been revoked, all tokens for the user are revoked
   * (token-reuse detection) and the request is rejected.
   */
  async rotateRefreshToken(
    token: string,
    ctx: RefreshContext = {},
  ): Promise<IssuedTokens> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
      include: { user: true },
    });

    if (!stored || stored.tokenHash !== hashToken(token)) {
      throw new UnauthorizedException('Refresh token not recognized');
    }

    if (stored.revokedAt) {
      // Replay detected — invalidate the entire chain for this user
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const issued = await this.issueTokensForUser(stored.user, ctx);

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: {
        revokedAt: new Date(),
        replacedBy: extractJti(issued.refreshToken, this.jwtService, this.refreshSecret),
      },
    });

    return issued;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.refreshSecret,
      });
    } catch {
      // Silently ignore — logout should be idempotent
      return;
    }

    await this.prisma.refreshToken.updateMany({
      where: { id: payload.jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllRefreshTokensForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ─── Password reset token helpers ──────────────────────────────────────────

  generatePasswordResetToken(): { token: string; tokenHash: string } {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    return { token, tokenHash };
  }

  hashPasswordResetToken(token: string): string {
    return hashToken(token);
  }

  get accessTokenLifetimeSeconds(): number {
    return this.accessExpiresInSeconds;
  }
}

// ─── helpers ────────────────────────────────────────────────────────────────

function required(config: ConfigService, key: string): string {
  const value = config.get<string>(key);
  if (!value) {
    throw new Error(`${key} is not configured`);
  }
  return value;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function extractJti(token: string, jwt: JwtService, secret: string): string {
  const decoded = jwt.verify<RefreshTokenPayload>(token, { secret });
  return decoded.jti;
}

function parseDurationToSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) {
    const asNumber = Number(value);
    if (!Number.isFinite(asNumber)) {
      throw new Error(`Invalid duration: ${value}`);
    }
    return asNumber;
  }
  const amount = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 60 * 60;
    case 'd':
      return amount * 60 * 60 * 24;
    default:
      throw new Error(`Invalid duration unit: ${unit}`);
  }
}
