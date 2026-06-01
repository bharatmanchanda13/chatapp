import { Injectable } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from '../prisma/prisma.service';

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
}
