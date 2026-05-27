import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { Request } from 'express';
import { JwtService } from 'src/jwt/jwt.service';
import { AuthGuard } from './auth.guard';
import { LogoutDto } from './dto/logout.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService, private readonly jwtService: JwtService) {
        
    }

    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @UseGuards(AuthGuard)
    @Post('logout')
    async logout(@Req() req: Request, @Body() body: LogoutDto) {
        const accessToken = req.headers.authorization as string;
        const refreshToken = body.refreshToken;
        return this.jwtService.revokeTokens(req['user'].id, accessToken, refreshToken);
    }

    @UseGuards(AuthGuard)
    @Get('profile')
    async getProfile(@Req() req: Request) {
        const user = req['user'];
        return user;
    }
}
