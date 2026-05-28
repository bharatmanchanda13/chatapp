import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService, private readonly authService: AuthService) {}
    async getList() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
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
}
