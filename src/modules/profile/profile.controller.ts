import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';
import { UpdateLocationDto } from './dto/update-location';
import { CreateMediaDto } from '../album/dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @UseGuards(AuthGuard)
    @Put()
    update(@Body() dto: UpdateProfileDto, @Req() req: Request) {
        const userId = req['user'].id;
        return this.profileService.update(dto, userId);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Get(':id')
    async viewProfile(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
        return this.profileService.view(id, req['user'].id);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Get()
    async getMe(@Req() req: Request) {
        const userId = req['user'].id;
        return this.profileService.getMe(userId);
    }

    @UseGuards(AuthGuard)
    @Put('update-location')
    async updateLocation(@Body() dto: UpdateLocationDto, @Req() req: Request) {
        const userId = req['user'].id;
        return this.profileService.updateLocation(dto, userId);
    }

    @UseGuards(AuthGuard)
    @Post('media')
    async addMedia(@Body() dto: CreateMediaDto, @Req() req: Request) {
        const userId = req['user'].id;
        return this.profileService.addMedia(userId, dto);
    }

    @UseGuards(AuthGuard)
    @Put(':mediaId/media')
    async updateMedia(
        @Param('mediaId', ParseIntPipe) mediaId: number,
        @Body() dto: UpdateMediaDto,
        @Req() req: Request,
    ) {
        const userId = req['user'].id;
        return this.profileService.updateMedia(userId, mediaId, dto);
    }

    @UseGuards(AuthGuard)
    @Delete(':mediaId/media')
    async deleteMedia(
        @Param('mediaId', ParseIntPipe) mediaId: number,
        @Req() req: Request,
    ) {
        const userId = req['user'].id;
        return this.profileService.deleteMedia(userId, mediaId);
    }

    
}