import { Module } from '@nestjs/common';
import { FriendService } from './friend.service';
import { FriendController } from './friend.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '../jwt/jwt.module';
import { ChatService } from '../chat/chat.service';
import { NotificationModule } from '../notification/notification.module';


@Module({
  imports: [PrismaModule, JwtModule, NotificationModule],
  controllers: [FriendController],
  providers: [FriendService, ChatService],
})
export class FriendModule {}

