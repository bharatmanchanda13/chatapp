import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLocationDto } from './dto/update-location';
import { getDistance } from 'geolib';
import { NotificationService } from '../notification/notification.service';
import { CreateMediaDto } from '../album/dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { NotificationType } from '@prisma/client';

@Injectable()
export class ProfileService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService,
    ) {}
    async update(dto: UpdateProfileDto, userId: number) {
        return this.prisma.profile.update({
            where: { userId },
            data: {
                ...dto,
            }
        });
    }

    async view(userId: number, authUserId: number) {
        const profile = await this.prisma.profile.findFirst({
            where: { userId },
            include: {
                user: true,
            },
        });

        if (!profile) {
            throw new NotFoundException('Profile not found');
        } else {
            const isAlreadyViewed = await this.prisma.profileView.findFirst({
                where: {
                    viewerId: authUserId,
                    profileId: userId,
                },
            });

            if (!isAlreadyViewed) {
                await this.prisma.profileView.create({
                    data: {
                        viewerId: authUserId,
                        profileId: userId,
                    },
                });

                if (authUserId !== userId) {
                    try {
                        const viewer = await this.prisma.user.findUnique({
                            where: { id: authUserId },
                            select: { name: true },
                        });
                        this.notificationService.sendAndSave(
                            userId,
                            'Profile Viewed',
                            `${viewer?.name || 'Someone'} viewed your profile.`,
                            NotificationType.PROFILE_VIEW,
                            {
                                viewerId: String(authUserId),
                            }
                        ).catch(err => console.error('Failed to send profile viewed notification:', err));
                    } catch (error) {
                        console.error('Failed to send notification for profile view:', error);
                    }
                }
            }
        }
        return profile;
    }

    async updateLocation(dto: UpdateLocationDto, userId: number) {
        const existing = await this.prisma.profile.findUnique({
            where: {
                userId,
            },
        });

        if (existing && existing.latitude && existing.longitude) {
            const distance = getDistance(
                { latitude: existing.latitude, longitude: existing.longitude },
                { latitude: dto.latitude, longitude: dto.longitude }
            );

            if (distance < 500) {
                throw new BadRequestException('Location is too close to the previous one');
            }
        }

        return this.prisma.profile.update({
            where: { userId },
            data: {
                latitude: dto.latitude,
                longitude: dto.longitude,
            }
        });
    }

    async addMedia(userId: number, dto: CreateMediaDto) {
        let profile = await this.prisma.profile.findUnique({
            where: { userId },
        });

        if (!profile) {
            profile = await this.prisma.profile.create({
                data: { userId },
            });
        }

        return this.prisma.media.create({
            data: {
                userId,
                ownerType: 'PROFILE',
                ownerId: profile.id,
                type: dto.type,
                url: dto.url,
                storageKey: dto.storageKey,
            },
        });
    }

    async updateMedia(userId: number, mediaId: number, dto: UpdateMediaDto) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });

        if (!profile) {
            throw new NotFoundException('Profile not found');
        }

        const media = await this.prisma.media.findUnique({
            where: { id: mediaId },
        });

        if (!media || media.ownerType !== 'PROFILE' || media.ownerId !== profile.id) {
            throw new NotFoundException('Media not found on this profile');
        }

        return this.prisma.media.update({
            where: { id: mediaId },
            data: {
                type: dto.type,
                url: dto.url,
                storageKey: dto.storageKey,
            },
        });
    }

    async deleteMedia(userId: number, mediaId: number) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });

        if (!profile) {
            throw new NotFoundException('Profile not found');
        }

        const media = await this.prisma.media.findUnique({
            where: { id: mediaId },
        });

        if (!media || media.ownerType !== 'PROFILE' || media.ownerId !== profile.id) {
            throw new NotFoundException('Media not found on this profile');
        }

        return this.prisma.media.delete({
            where: { id: mediaId },
        });
    }
}
