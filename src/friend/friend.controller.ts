import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { FriendService } from './friend.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { RespondFriendRequestDto } from './dto/respond-friend-request.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('friend')
export class FriendController {
    constructor(private readonly friendService: FriendService) {}

    @UseGuards(AuthGuard)
    @Post('request')
    async sendFriendRequest(@Req() req: Request, @Body() dto: SendFriendRequestDto) {
        console.log('Received friend request:', dto);
        const senderId = req['user'].id;
        return this.friendService.sendFriendRequest(senderId, dto.receiverId);
    }

    @UseGuards(AuthGuard)
    @Put('request/:id')
    async respondFriendRequest(@Param('id') requestId: number, @Body() dto: RespondFriendRequestDto, @Req() req: Request) {
        const userId = req['user'].id;
        return this.friendService.updateFriendRequest(requestId, userId, dto.action);
    }

    @UseGuards(AuthGuard)
    @Get('request')
    async getFriendRequests(@Req() req: Request) {
        const userId = req['user'].id;
        return this.friendService.getFriendRequests(userId);
    }

    @UseGuards(AuthGuard)
    @Get('')
    async getFriends(@Req() req: Request) {
        const userId = req['user'].id;
        return this.friendService.getFriends(userId);
    }

    @UseGuards(AuthGuard)
    @Get(':id')
    async getFriendDetails(@Param('id') friendId: number, @Req() req: Request) {
        const userId = req['user'].id;
        return this.friendService.getFriendDetails(userId, friendId);
    }

    @UseGuards(AuthGuard)
    @Delete(':friendId')
    async unfriend(@Req() req: Request, @Param('friendId') friendId: number ) {
        return this.friendService.unfriend(req['user'].id, friendId);
    }
}
