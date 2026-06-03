import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from '../auth/auth.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { UserFilterDto } from './dto/user-filter.dto';
import { UserFilterBuilder } from './user-filter.builder';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly authService: AuthService,
        private readonly paginationService: PaginationService,
        private readonly userFilterBuilder: UserFilterBuilder,
    ) { }
    async getList(dto: UserFilterDto, currentUserId?: number) {
        let friendIds: number[] = [];

        if (dto.isFriend !== undefined && currentUserId) {
            const friendships = await this.prisma.friendship.findMany({
                where: {
                    OR: [
                        { userOneId: currentUserId },
                        { userTwoId: currentUserId },
                    ],
                },
                select: {
                    userOneId: true,
                    userTwoId: true,
                },
            });

            friendIds = friendships.map((f) =>
                f.userOneId === currentUserId ? f.userTwoId : f.userOneId,
            );
        }

        return this.paginationService.paginate(this.prisma.user, {
            page: dto.page,
            limit: dto.perPage,

            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                profile: true,
            },

            where: this.userFilterBuilder.build(dto, {
                friendIds,
                currentUserId,
            }),

            orderBy: {
                id: 'desc',
            },
        });
    }

    async getOne(id: number) {
        return this.prisma.user.findUnique({
            where: {
                id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async delete(id: number) {
        return this.prisma.user.delete({
            where: {
                id,
            },
        });
    }

    async update(id: number, data: UpdateUserDto) {
        return this.prisma.user.update({
            where: {
                id,
            },
            data,
        });
    }

    async create(data: RegisterDto) {
        return this.authService.register(data);
    }

    async block(data: {
        blockerId: number;
        blockedId: number;
        reason?: string;
    }) {
        if (data.blockerId === data.blockedId) {
            throw new BadRequestException('You cannot block yourself');
        }

        const existingBlock = await this.prisma.userBlock.findUnique({
            where: {
                blockerId_blockedId: {
                    blockerId: data.blockerId,
                    blockedId: data.blockedId,
                },
            },
        });

        if (existingBlock) {
            throw new ConflictException('You have already blocked this user');
        }

        return await this.prisma.userBlock.create({
            data: {
                blockerId: data.blockerId,
                blockedId: data.blockedId,
                reason: data.reason,
            },
        });
    }

    async unblock(data: {
        blockerId: number;
        blockedId: number;
    }) {
        const existingBlock = await this.prisma.userBlock.findFirst({
            where: {
                blockerId: data.blockerId,
                blockedId: data.blockedId,
            },
        });

        if (!existingBlock) {
            throw new BadRequestException('This user is not blocked');
        }

        return this.prisma.userBlock.delete({
            where: {
                id: existingBlock.id,
            },
        });
    }

    async registerDevice(dto: RegisterDeviceDto & {
        userId: number;
    }) {
        return this.prisma.deviceToken.upsert({
            where: {
                fcmToken: dto.fcmToken,
            },
            update: {
                isActive: true,
                deviceId: dto.deviceId,
            },
            create: {
                userId: dto.userId,
                fcmToken: dto.fcmToken,
                deviceId: dto.deviceId,
                platform: dto.platform,
            },
        });
    }
}
