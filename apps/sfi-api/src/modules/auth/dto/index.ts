import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsJWT,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

// ============================================
// Register
// ============================================

export class RegisterDto {
  @ApiProperty({
    description: 'Full name (single field; FE form has one "Full Name" input)',
    example: 'Sarah Chen',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName!: string;

  @ApiProperty({ example: 'sarah@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    description: 'Password (min 8 characters)',
    example: 'admin1234!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

// ============================================
// Login
// ============================================

export class LoginDto {
  @ApiProperty({ example: 'sarah@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'admin1234!' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

// ============================================
// Refresh
// ============================================

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token issued by /auth/login or /auth/refresh',
  })
  @IsJWT()
  refreshToken!: string;
}

// ============================================
// Forgot / Reset Password
// ============================================

export class ForgotPasswordDto {
  @ApiProperty({ example: 'sarah@example.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Reset token received via email link',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'newpassword123!', minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}

// ============================================
// User (response shape used by /auth/me, login, register, refresh)
// ============================================

export class AuthUserDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  id!: string;

  @ApiProperty({ example: 'Sarah Chen' })
  name!: string;

  @ApiProperty({ example: 'sarah@example.com' })
  email!: string;

  @ApiPropertyOptional({
    description:
      'Avatar image URL. Currently always null until the Cloud bucket integration ships.',
    example: null,
    nullable: true,
  })
  avatarUrl!: string | null;

  @ApiProperty({ example: 'USER', enum: ['ADMIN', 'USER'] })
  role!: 'ADMIN' | 'USER';
}

// ============================================
// Auth Response Envelopes
// ============================================

export class AuthTokensDto {
  @ApiProperty({ description: 'Short-lived JWT access token (default 15 min)' })
  accessToken!: string;

  @ApiProperty({ description: 'Long-lived JWT refresh token (default 7 days)' })
  refreshToken!: string;

  @ApiProperty({ description: 'Access token expiry in seconds', example: 900 })
  expiresIn!: number;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;

  @ApiProperty({ type: AuthTokensDto })
  tokens!: AuthTokensDto;
}

// ============================================
// Forgot Password Response
// ============================================

export class ForgotPasswordResponseDto {
  @ApiProperty({
    description:
      'Constant-time success message — returned even if the email is not found, to prevent enumeration.',
    example:
      'If an account with that email exists, a password reset link has been sent.',
  })
  message!: string;

  @ApiProperty({
    description: 'The email the request was made for (echoed back so the FE can render it).',
    example: 'sarah@example.com',
  })
  email!: string;
}

// ============================================
// Generic Message Response
// ============================================

export class MessageResponseDto {
  @ApiProperty({ example: 'Password updated successfully.' })
  message!: string;
}
