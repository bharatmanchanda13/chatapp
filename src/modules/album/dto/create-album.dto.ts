import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAlbumDto {
    @IsNotEmpty()
    @IsString()
    title: string;
}
