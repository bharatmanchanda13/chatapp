import { BadRequestException, Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '../jwt/jwt.service';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) {}

    async login(dto: LoginDto): Promise<any> {
        const existingUser = await this.prisma.user.findFirst({
            where: {
            OR: [
                { email: dto.username },
                { phone: dto.username },
            ],
            },
        });
        if (!existingUser) {
            throw new BadRequestException(
                'Invalid credentials',
            );
        }

        const isPasswordValid = await bcrypt.compare(dto.password, existingUser.password);
        if (!isPasswordValid) {
            throw new BadRequestException(
                'Invalid credentials',
            );
        }

        const { password, accessTokens, refreshTokens, ...safeUser } = existingUser;
        const { accessToken, refreshToken } = await this.jwtService.generateTokens(safeUser);
        return {
            user: safeUser,
            accessToken,
            refreshToken
        };
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

    async logout(userId: number) {
        // await this.jwtService.revokeTokens(userId); // Revoke the user's tokens.
    }
}
