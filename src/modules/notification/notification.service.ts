import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from './firebase.service';

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
}
