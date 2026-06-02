import { MediaType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateMediaDto {
    @IsOptional()
    @IsEnum(MediaType)
    type?: MediaType;

    @IsOptional()
    @IsString()
    storageKey?: string;

    @IsOptional()
    @IsUrl()
    url?: string;
}
