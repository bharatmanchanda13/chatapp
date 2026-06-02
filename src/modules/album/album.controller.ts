import { Body, Controller, Delete, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AlbumService } from './album.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { CreateMediaDto } from './dto/create-media.dto';

@Controller('album')
@UseGuards(AuthGuard)
export class AlbumController {
    constructor(private readonly albumService: AlbumService) {}

    @Post()
    async create(@Body() dto: CreateAlbumDto, @Req() req: any) {
        const userId = req['user'].id;
        return this.albumService.create(userId, dto);
    }

    @Delete(':id')
    async delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        const userId = req['user'].id;
        return this.albumService.delete(userId, id);
    }

    @Post(':id/media')
    async addMedia(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CreateMediaDto,
        @Req() req: any,
    ) {
        const userId = req['user'].id;
        return this.albumService.addMedia(userId, id, dto);
    }

    @Delete(':id/media/:mediaId')
    async removeMedia(
        @Param('id', ParseIntPipe) id: number,
        @Param('mediaId', ParseIntPipe) mediaId: number,
        @Req() req: any,
    ) {
        const userId = req['user'].id;
        return this.albumService.removeMedia(userId, id, mediaId);
    }
}
