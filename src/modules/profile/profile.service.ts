import { Injectable } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLocationDto } from './dto/update-location';
import { getDistance } from 'geolib';

@Injectable()
export class ProfileService {
    constructor(
        private readonly prisma: PrismaService,
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

        if (!profile || profile.userId !== authUserId) {
            return { message: 'Profile not found or access denied' };
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
                return { message: 'Location is too close to the previous one' };
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
}
