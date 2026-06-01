import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @Put()
    @UseGuards(AuthGuard)
    update(@Body() dto: UpdateProfileDto, @Req() req: Request) {
        const userId = req['user'].id;
        return this.profileService.update(dto, userId);
    }

    @Get(':id')
    @UseGuards(AuthGuard)
    async viewProfile(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
        return this.profileService.view(id, req['user'].id);
    }

}