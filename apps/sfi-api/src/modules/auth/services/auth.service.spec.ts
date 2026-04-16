import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';

import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

jest.mock('@prisma/client', () => ({
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  PrismaClient: class PrismaClient {
    static readonly __mock = true;
  },
  UserRole: { ADMIN: 'ADMIN', USER: 'USER' },
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-123',
    email: 'sarah@example.com',
    name: 'Sarah Chen',
    passwordHash: '$2b$12$hashed',
    avatarUrl: null,
    role: 'USER' as const,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTokens = {
    accessToken: 'access.jwt.token',
    refreshToken: 'refresh.jwt.token',
    expiresIn: 900,
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockPasswordService = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  const mockTokenService = {
    issueTokensForUser: jest.fn(),
    rotateRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
    revokeAllRefreshTokensForUser: jest.fn(),
    generatePasswordResetToken: jest.fn(),
    hashPasswordResetToken: jest.fn(),
  };

  const mockEmailService = {
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockAuditLogService = {
    create: jest.fn().mockResolvedValue({}),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── register ─────────────────────────────────────────────────────────────

  describe('register', () => {
    it('hashes the password, creates the user, issues tokens, and returns the auth response', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPasswordService.hash.mockResolvedValue('$2b$12$hashed');
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockTokenService.issueTokensForUser.mockResolvedValue(mockTokens);

      const result = await service.register({
        fullName: 'Sarah Chen',
        email: 'Sarah@Example.com',
        password: 'admin1234!',
      });

      expect(mockPasswordService.hash).toHaveBeenCalledWith('admin1234!');
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'sarah@example.com', // normalized
          name: 'Sarah Chen',
          passwordHash: '$2b$12$hashed',
        }),
      });
      expect(result.user.email).toBe('sarah@example.com');
      expect(result.tokens).toEqual(mockTokens);
      expect(mockAuditLogService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATED', entityType: 'User' }),
      );
    });

    it('throws ConflictException when email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({
          fullName: 'Sarah',
          email: 'sarah@example.com',
          password: 'admin1234!',
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns tokens and user on valid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(true);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockTokenService.issueTokensForUser.mockResolvedValue(mockTokens);

      const result = await service.login({
        email: 'sarah@example.com',
        password: 'admin1234!',
      });

      expect(result.user.id).toBe('user-123');
      expect(result.tokens).toEqual(mockTokens);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { lastLoginAt: expect.any(Date) },
      });
      expect(mockAuditLogService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGGED_IN' }),
      );
    });

    it('throws UnauthorizedException on unknown email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPasswordService.compare.mockResolvedValue(false);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'whatever' }),
      ).rejects.toThrow(UnauthorizedException);

      // Still calls compare for timing-safety
      expect(mockPasswordService.compare).toHaveBeenCalled();
    });

    it('throws UnauthorizedException on wrong password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(false);

      await expect(
        service.login({ email: 'sarah@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── forgot password ──────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('returns the constant success message even when the email is unknown', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword('unknown@example.com');

      expect(result.message).toContain('If an account');
      expect(result.email).toBe('unknown@example.com');
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(mockPrismaService.passwordResetToken.create).not.toHaveBeenCalled();
    });

    it('invalidates any previous tokens before issuing a new one (idempotent Resend)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockTokenService.generatePasswordResetToken.mockReturnValue({
        token: 'plain-reset-token',
        tokenHash: 'hashed-reset-token',
      });
      mockPrismaService.passwordResetToken.create.mockResolvedValue({});

      await service.forgotPassword('sarah@example.com');

      expect(mockPrismaService.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
      expect(mockPrismaService.passwordResetToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          tokenHash: 'hashed-reset-token',
        }),
      });
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'sarah@example.com',
        'plain-reset-token',
      );
    });
  });

  // ─── reset password ───────────────────────────────────────────────────────

  describe('resetPassword', () => {
    const validStored = {
      id: 'token-1',
      userId: 'user-123',
      tokenHash: 'hashed',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    };

    it('updates the password, marks the token used, and revokes refresh tokens', async () => {
      mockTokenService.hashPasswordResetToken.mockReturnValue('hashed');
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(validStored);
      mockPasswordService.hash.mockResolvedValue('$2b$12$newhash');
      mockPrismaService.$transaction.mockResolvedValue([]);

      const result = await service.resetPassword({
        token: 'plain-token',
        newPassword: 'newpassword123!',
      });

      expect(result.message).toContain('updated');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockTokenService.revokeAllRefreshTokensForUser).toHaveBeenCalledWith('user-123');
      expect(mockAuditLogService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PASSWORD_RESET_COMPLETED' }),
      );
    });

    it('rejects an unknown token', async () => {
      mockTokenService.hashPasswordResetToken.mockReturnValue('hashed');
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'bad', newPassword: 'newpassword123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an already-used token', async () => {
      mockTokenService.hashPasswordResetToken.mockReturnValue('hashed');
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue({
        ...validStored,
        usedAt: new Date(),
      });

      await expect(
        service.resetPassword({ token: 'used', newPassword: 'newpassword123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an expired token', async () => {
      mockTokenService.hashPasswordResetToken.mockReturnValue('hashed');
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue({
        ...validStored,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.resetPassword({ token: 'expired', newPassword: 'newpassword123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('revokes the refresh token and returns a success message', async () => {
      const result = await service.logout('refresh.jwt.token');

      expect(mockTokenService.revokeRefreshToken).toHaveBeenCalledWith('refresh.jwt.token');
      expect(result.message).toContain('Logged out');
    });
  });

  // ─── me ───────────────────────────────────────────────────────────────────

  describe('me', () => {
    it('returns the user profile for the authenticated user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.me({
        id: 'user-123',
        email: 'sarah@example.com',
        role: 'USER',
      });

      expect(result.id).toBe('user-123');
      expect(result.name).toBe('Sarah Chen');
      expect(result.avatarUrl).toBeNull();
    });
  });
});
