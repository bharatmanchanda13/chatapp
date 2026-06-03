import { Gender, RelationshipStatus } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsLongitude()
  @MaxLength(255)
  longitude?: number;

  @IsOptional()
  @IsLatitude()
  @MaxLength(255)
  latitude?: number;

  @IsOptional()
  @IsEnum(RelationshipStatus)
  relationshipStatus?: RelationshipStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}