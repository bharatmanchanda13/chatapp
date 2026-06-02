import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { CreateMediaDto } from './dto/create-media.dto';

@Injectable()
export class AlbumService {
    constructor(private readonly prisma: PrismaService) {}

    async create(userId: number, dto: CreateAlbumDto) {
        return this.prisma.album.create({
            data: {
                userId,
                title: dto.title,
            },
        });
    }

    async delete(userId: number, id: number) {
        const album = await this.prisma.album.findUnique({
            where: { id },
        });

        if (!album) {
            throw new NotFoundException('Album not found');
        }

        if (album.userId !== userId) {
            throw new ForbiddenException('You do not own this album');
        }

        // Delete all associated media first (polymorphic relationship)
        await this.prisma.media.deleteMany({
            where: {
                ownerType: 'ALBUM',
                ownerId: id,
            },
        });

        // Delete the album
        return this.prisma.album.delete({
            where: { id },
        });
    }

    async addMedia(userId: number, albumId: number, dto: CreateMediaDto) {
        const album = await this.prisma.album.findUnique({
            where: { id: albumId },
        });

        if (!album) {
            throw new NotFoundException('Album not found');
        }

        if (album.userId !== userId) {
            throw new ForbiddenException('You do not own this album');
        }

        return this.prisma.media.create({
            data: {
                userId,
                ownerType: 'ALBUM',
                ownerId: albumId,
                type: dto.type,
                url: dto.url,
                storageKey: dto.storageKey,
            },
        });
    }

    async removeMedia(userId: number, albumId: number, mediaId: number) {
        const album = await this.prisma.album.findUnique({
            where: { id: albumId },
        });

        if (!album) {
            throw new NotFoundException('Album not found');
        }

        if (album.userId !== userId) {
            throw new ForbiddenException('You do not own this album');
        }

        const media = await this.prisma.media.findUnique({
            where: { id: mediaId },
        });

        if (!media || media.ownerType !== 'ALBUM' || media.ownerId !== albumId) {
            throw new NotFoundException('Media not found in this album');
        }

        return this.prisma.media.delete({
            where: { id: mediaId },
        });
    }
}
