import { Body, Controller, Post, Get, Patch, Param, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationService } from './notification.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { Request } from 'express';

@Controller('notification')
export class NotificationController {
    constructor(
        private readonly notificationService: NotificationService,
    ) {}

    @Post('send')
    async sendNotification(
        @Body() dto: SendNotificationDto,
    ) {
        await this.notificationService.sendToUser(
            dto.userId,
            dto.title,
            dto.body,
        );

        return {
            success: true,
            message: 'Notification sent',
        };
    }

    @UseGuards(AuthGuard)
    @Get()
    async getList(@Req() req: Request) {
        return this.notificationService.getUserNotifications((req['user'] as any).id);
    }

    @UseGuards(AuthGuard)
    @Patch(':id/read')
    async markAsRead(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: Request,
    ) {
        return this.notificationService.markAsRead((req['user'] as any).id, id);
    }

    @UseGuards(AuthGuard)
    @Post('read-all')
    async readAll(@Req() req: Request) {
        await this.notificationService.markAllAsRead((req['user'] as any).id);
        return {
            success: true,
            message: 'All notifications marked as read',
        };
    }
}
