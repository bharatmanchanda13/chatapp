import { MediaType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateMediaDto {
    @IsNotEmpty()
    @IsEnum(MediaType)
    type: MediaType;

    @IsNotEmpty()
    @IsString()
    storageKey: string;

    @IsNotEmpty()
    @IsUrl()
    url: string;
}
