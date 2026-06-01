import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';
import { UpdateLocationDto } from './dto/update-location';

@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @UseGuards(AuthGuard)
    @Put()
    update(@Body() dto: UpdateProfileDto, @Req() req: Request) {
        const userId = req['user'].id;
        return this.profileService.update(dto, userId);
    }

    @UseGuards(AuthGuard)
    @Get(':id')
    async viewProfile(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
        return this.profileService.view(id, req['user'].id);
    }

    @UseGuards(AuthGuard)
    @Put('update-location')
    async updateLocation(@Body() dto: UpdateLocationDto, @Req() req: Request) {
        const userId = req['user'].id;
        return this.profileService.updateLocation(dto, userId);
    }
}