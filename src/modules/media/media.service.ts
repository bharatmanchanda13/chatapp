import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { S3Service } from './s3.service';

@Injectable()
export class MediaService {
    constructor(private readonly s3Service: S3Service) {}
    async generateUploadUrl(
        userId: number,
        fileName: string,
        mimeType: string,
    ) {
        const extension = fileName.split('.').pop();
        const key =`users/${userId}/${randomUUID()}.${extension}`;
        const uploadUrl = await this.s3Service.getUploadUrl(key, mimeType);
        return {
            uploadUrl,
            key,
        };
    }
}
