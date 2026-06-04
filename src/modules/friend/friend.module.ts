import { Module } from '@nestjs/common';
import { FriendService } from './friend.service';
import { FriendController } from './friend.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '../jwt/jwt.module';
import { ChatModule } from '../chat/chat.module';
import { NotificationModule } from '../notification/notification.module';


@Module({
  imports: [PrismaModule, JwtModule, NotificationModule, ChatModule],
  controllers: [FriendController],
  providers: [FriendService],
})
export class FriendModule {}

