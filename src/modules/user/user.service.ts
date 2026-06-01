import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from '../auth/auth.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { UserFilterDto } from './dto/user-filter.dto';
import { UserFilterBuilder } from './user-filter.builder';

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly authService: AuthService,
        private readonly paginationService: PaginationService,
        private readonly userFilterBuilder: UserFilterBuilder,
    ) {}
    async getList(dto: UserFilterDto) {

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

            where: this.userFilterBuilder.build(dto),

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

        const existingBlock = await this.prisma.userBlock.findFirst({
            where: {
                OR: [
                    {
                        blockerId: data.blockerId,
                        blockedId: data.blockedId,
                    },
                    {
                        blockerId: data.blockedId,
                        blockedId: data.blockerId,
                    },
                ],
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
}
