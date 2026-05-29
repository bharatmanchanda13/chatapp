import { Controller, Get, Req, UseGuards } from '@nestjs/common';
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
}
