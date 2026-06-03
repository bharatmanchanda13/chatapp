import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { Request } from 'express';
import { JwtService } from '../jwt/jwt.service';
import { AuthGuard } from './guards/auth.guard';
import { LogoutDto } from './dto/logout.dto';
import { Purpose, SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify.dto';
import { RolesGuard } from './guards/roles.guard';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Roles } from './decorators/roles.decorator';
import { Role } from './enums/role.enum';
import { GoogleLoginDto } from './dto/google-login.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService, private readonly jwtService: JwtService) {
        
    }

    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @UseGuards(AuthGuard)
    @Post('logout')
    async logout(@Req() req: Request, @Body() body: LogoutDto) {
        const accessToken = req.headers.authorization as string;
        const refreshToken = body.refreshToken;
        const userId = (req['user'] as any).id;
        return this.authService.logout(userId, accessToken, refreshToken);
    }

    @UseGuards(AuthGuard)
    @Get('profile')
    async getProfile(@Req() req: Request) {
        const user = req['user'];
        return user;
    }

    @Post('send-otp')
    async sendOtp(@Body() dto: SendOtpDto) {
        return this.authService.sendOtp(dto);
    }

    @Post('verify-otp')
    async verifyOtp(@Body() dto: VerifyOtpDto) {
        if (dto.purpose === Purpose.EMAIL_VERIFICATION) {
            const result = await this.authService.verifyOtp(dto) as any;
            if (result) {
                return {
                    message: 'Email verified successfully',
                    ...result,
                };
            } else {
                return {
                    message: 'Invalid OTP',
                };
            }
        } 
    }

    @Post('reset-password')
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

    @Post('google')
    async googleLogin(
        @Body() dto: GoogleLoginDto,
    ) {
        return this.authService.googleLogin(dto.idToken);
    }
}
