import { BadRequestException, Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '../jwt/jwt.service';
import { Purpose, SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify.dto';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) {}

    private generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
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
            throw new BadRequestException('User already exists');
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

    async logout(userId: number, accessToken: string, refreshToken: string) {
        await this.jwtService.revokeTokens(userId, accessToken, refreshToken); // Revoke the user's tokens.
    }

    async sendOtp(dto: SendOtpDto) {
        const { email, purpose } = dto;

        if (purpose === Purpose.EMAIL_VERIFICATION) {
            const user = await this.prisma.user.findUnique({
                where: {
                    email,
                    isEmailVerified: true,
                },
            });

            if (user) {
                throw new BadRequestException('User with this email already exists and is verified');
            }
        }

        const otp = this.generateOtp();

        await this.prisma.otpVerification.deleteMany({
            where: {
                email,
                purpose,
            },
        });

        await this.prisma.otpVerification.create({
            data: {
                email,
                otp,
                purpose,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            },
        });
    }

    async verifyOtp(dto: VerifyOtpDto) {
        const { name, phone, password, confirmPassword, email, otp, purpose } = dto;
        const record = await this.prisma.otpVerification.findFirst({
            where: {
                email,
                otp,
                purpose,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });

        if (purpose === Purpose.EMAIL_VERIFICATION) {
            if (!name || !phone || !password || !confirmPassword) {
                throw new BadRequestException('Missing required fields');
            }
            if (password !== confirmPassword) {
                throw new BadRequestException('Passwords do not match');
            }
            const user = await this.prisma.user.create({
                data: {
                    name,
                    phone,
                    email,
                    password: await bcrypt.hash(password, 10),
                    isEmailVerified: true,
                },
            });
            const { password: hashedPassword, accessTokens, refreshTokens, ...safeUser } = user;
            const { accessToken, refreshToken } = await this.jwtService.generateTokens(safeUser);
            return {
                user,
                accessToken,
                refreshToken
            };
        }
        if (!record) {
            throw new BadRequestException('Invalid or expired OTP');
        }
        await this.prisma.otpVerification.deleteMany({
            where: {
                email,
                purpose,
            },
        });
        return true;
    }

}
