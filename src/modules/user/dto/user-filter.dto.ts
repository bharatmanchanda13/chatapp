import { Gender, RelationshipStatus } from '@prisma/client';
import { Type, Transform } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsBoolean, IsNumber, IsDate, IsArray } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class UserFilterDto extends PaginationDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @IsOptional()
    @IsEnum(RelationshipStatus)
    relationshipStatus?: RelationshipStatus;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true ? true : (value === 'false' || value === false ? false : undefined))
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    dob?: Date;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    weight?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    height?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    interests?: string[];

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    longitude?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    radius?: number;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true ? true : (value === 'false' || value === false ? false : undefined))
    @IsBoolean()
    online?: boolean;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true ? true : (value === 'false' || value === false ? false : undefined))
    @IsBoolean()
    isFriend?: boolean;
}