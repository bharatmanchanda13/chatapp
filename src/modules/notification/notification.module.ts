import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { FirebaseService } from './firebase.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, FirebaseService, PrismaService]
})
export class NotificationModule {}
