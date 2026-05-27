import { BadRequestException, Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) {}

    async login(dto: LoginDto): Promise<any> {
        
    }

    async register(dto: RegisterDto): Promise<any> {
        const existingUser = await this.prisma.user.findFirst({
            where: {
            OR: [
                { email: dto.email },
                { phone: dto.phone },
            ],
            },
        });
        if (existingUser) {
            throw new BadRequestException(
                'User already exists',
            );
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                password: hashedPassword,
            },
        });
        return user;
    }
}
