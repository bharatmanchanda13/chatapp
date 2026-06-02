import { Body, Controller, Post, Req } from '@nestjs/common';
import { GenerateUploadDto } from './dto/generate-upload.dto';
import type { Request } from 'express';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
    constructor(private readonly mediaService: MediaService) {}
    @Post('upload-url')
    async generateUploadUrl(@Body() dto: GenerateUploadDto, @Req() req: Request) {
        return this.mediaService.generateUploadUrl(
            req['user'].id,
            dto.fileName,
            dto.mimeType,
        );
    }
}
