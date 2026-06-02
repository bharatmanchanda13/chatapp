import { BadRequestException, Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '../jwt/jwt.service';
import { Purpose, SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify.dto';
import { EmailService } from '../email/email.service';
import { signupOtpTemplate } from '../email/templates/signup-otp.template';
import { forgotPasswordOtpTemplate } from '../email/templates/forgot-password-otp.template';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService,
    ) { }

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
            include: {
                profile: true,
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

        let profileMedia: any[] = [];
        if (existingUser.profile) {
            profileMedia = await this.prisma.media.findMany({
                where: {
                    ownerType: 'PROFILE',
                    ownerId: existingUser.profile.id,
                },
            });
        }

        const { accessToken, refreshToken } = await this.jwtService.generateTokens(safeUser);
        return {
            user: {
                ...safeUser,
                profileMedia,
            },
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
                profile: {
                    create: {},
                },
            },
            include: {
                profile: true,
            },
        });

        // Send email verification OTP using sendOtp
        await this.sendOtp({
            email: dto.email,
            purpose: Purpose.EMAIL_VERIFICATION,
        });

        const { password: _, accessTokens, refreshTokens, ...safeUser } = user;
        return {
            ...safeUser,
            profileMedia: [],
        };
    }

    async logout(userId: number, accessToken: string, refreshToken: string) {
        await this.jwtService.revokeTokens(userId, accessToken, refreshToken); // Revoke the user's tokens.
        await this.prisma.deviceToken.updateMany({
            where: {
                userId,
            },
            data: {
                isActive: false,
            },
        });
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

        // Send Email based on purpose
        let subject = '';
        let bodyHtml = ``;

        if (purpose === Purpose.EMAIL_VERIFICATION) {
            const template = signupOtpTemplate(otp, 10);
            subject = template.subject;
            bodyHtml = template.html;
        } else if (purpose === Purpose.FORGOT_PASSWORD) {
            const template = forgotPasswordOtpTemplate(otp, 10);
            subject = template.subject;
            bodyHtml = template.html;
        }

        try {
            await this.emailService.sendEmail(email, subject, bodyHtml);
        } catch (error) {
            console.error('Failed to send OTP email:', error);
            throw new BadRequestException('Failed to send OTP email');
        }
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
                    profile: {
                        create: {},
                    },
                },
                include: {
                    profile: true,
                },
            });
            const { password: hashedPassword, accessTokens, refreshTokens, ...safeUser } = user;
            const { accessToken, refreshToken } = await this.jwtService.generateTokens(safeUser);
            return {
                user: {
                    ...safeUser,
                    profileMedia: [],
                },
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
