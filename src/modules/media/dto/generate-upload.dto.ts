import { IsString } from "class-validator";

export class GenerateUploadDto {
    @IsString()
    fileName: string;
    
    @IsString()
    mimeType: string;
}