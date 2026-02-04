import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum ParticipantRoleDto {
  PRODUCER = 'PRODUCER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  INVESTOR = 'INVESTOR',
  TALENT = 'TALENT',
  STUDIO = 'STUDIO',
  LICENSOR = 'LICENSOR',
  LICENSEE = 'LICENSEE',
  COLLECTION_AGENT = 'COLLECTION_AGENT',
}

export class CreateParticipantDto {
  @ApiProperty({ description: 'Name of the participant', maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @ApiProperty({ enum: ParticipantRoleDto, description: 'Role of the participant' })
  @IsEnum(ParticipantRoleDto)
  role!: ParticipantRoleDto;

  @ApiPropertyOptional({ description: 'External ID reference', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalId?: string;

  @ApiPropertyOptional({ description: 'Email address of the participant' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateParticipantDto {
  @ApiPropertyOptional({ description: 'Name of the participant', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ enum: ParticipantRoleDto, description: 'Role of the participant' })
  @IsOptional()
  @IsEnum(ParticipantRoleDto)
  role?: ParticipantRoleDto;

  @ApiPropertyOptional({ description: 'External ID reference', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalId?: string;

  @ApiPropertyOptional({ description: 'Email address of the participant' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class ParticipantResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  dealId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ParticipantRoleDto })
  role!: ParticipantRoleDto;

  @ApiPropertyOptional()
  externalId?: string | null;

  @ApiPropertyOptional()
  email?: string | null;

  @ApiPropertyOptional()
  metadata?: Record<string, unknown> | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
