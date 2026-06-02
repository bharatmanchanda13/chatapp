import { Body, Controller, Post } from '@nestjs/common';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationService } from './notification.service';

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

    
}
