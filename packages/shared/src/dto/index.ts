/**
 * Data Transfer Objects (DTOs) for API validation
 * Using class-validator for validation decorators
 */

import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { DealStatus, ParticipantRole } from '../enums';

/**
 * DTO for creating a new deal
 */
export class CreateDealDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(DealStatus)
  status?: DealStatus;

  @IsDate()
  @Type(() => Date)
  effectiveDate!: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  terminationDate?: Date;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

/**
 * DTO for updating a deal
 */
export class UpdateDealDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(DealStatus)
  status?: DealStatus;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  terminationDate?: Date;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

/**
 * DTO for creating a new participant
 */
export class CreateParticipantDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsEnum(ParticipantRole)
  role!: ParticipantRole;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

/**
 * DTO for updating a participant
 */
export class UpdateParticipantDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEnum(ParticipantRole)
  role?: ParticipantRole;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

/**
 * DTO for pagination query parameters
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}

/**
 * DTO for ID parameter validation
 */
export class IdParamDto {
  @IsUUID()
  id!: string;
}
