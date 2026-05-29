import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ConversationService } from './conversation.service';

@Controller('conversation')
export class ConversationController {
    constructor(private readonly conversationService: ConversationService) {}
    @UseGuards(AuthGuard)
    @Get()
    async getList(@Req() req: Request) {
        return this.conversationService.getList(req['user'].id);
    }

    @UseGuards(AuthGuard)
    @Post()
    async findOrCreateDirectConversation(
        @Body('participantId', ParseIntPipe) participantId: number,
        @Req() req: Request,
    ) {
        return this.conversationService.findOrCreateDirectConversation(req['user'].id, participantId);
    }

    @UseGuards(AuthGuard)
    @Get(':id')
    async getDetails(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: Request,
    ) {
        return this.conversationService.getDetails(id, req['user'].id);
    }
}
