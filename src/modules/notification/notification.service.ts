import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from './firebase.service';
import { NotificationType } from './create-notification.enum';

@Injectable()
export class NotificationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly firebaseService: FirebaseService,
    ) {}

    async sendToUser(
        userId: number,
        title: string,
        body: string,
        data?: Record<string, string>,
    ) {
        const devices = await this.prisma.deviceToken.findMany({
            where: {
                userId,
                isActive: true,
            },
        });

        const tokens = devices.map(device => device.fcmToken);

        return this.firebaseService.sendToTokens(
            tokens,
            title,
            body,
            data,
        );
    }

    async sendAndSave(
        userId: number,
        title: string,
        body: string,
        type: NotificationType,
        metadata?: any,
    ) {
        await this.prisma.notification.create({
            data: {
                userId,
                title,
                body,
                type,
                metadata,
            },
        });

        const fcmData: Record<string, string> = {};
        if (metadata) {
            for (const key of Object.keys(metadata)) {
                fcmData[key] = String(metadata[key]);
            }
        }

        return this.sendToUser(userId, title, body, fcmData);
    }

    async getUserNotifications(userId: number) {
        return this.prisma.notification.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async markAsRead(userId: number, notificationId: number) {
        const notification = await this.prisma.notification.findUnique({
            where: {
                id: notificationId,
            },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        if (notification.userId !== userId) {
            throw new ForbiddenException('You do not own this notification');
        }

        return this.prisma.notification.update({
            where: {
                id: notificationId,
            },
            data: {
                isRead: true,
            },
        });
    }

    async markAllAsRead(userId: number) {
        return this.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
    }
}
