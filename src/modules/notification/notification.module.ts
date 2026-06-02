import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { FirebaseService } from './firebase.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtModule } from '../jwt/jwt.module';

@Module({
  imports: [JwtModule],
  controllers: [NotificationController],
  providers: [NotificationService, FirebaseService, PrismaService],
  exports: [NotificationService, FirebaseService],
})
export class NotificationModule {}
