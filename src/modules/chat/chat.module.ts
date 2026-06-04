import { Module } from '@nestjs/common';
import { OnlineUserService } from './online-user.service';
import { ChatService } from './chat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  providers: [OnlineUserService, ChatService],
  exports: [OnlineUserService, ChatService],
})
export class ChatModule {}
