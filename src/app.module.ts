import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { JwtModule } from './modules/jwt/jwt.module';
import { FriendModule } from './modules/friend/friend.module';
import { UserModule } from './modules/user/user.module';
import { ChatService } from './modules/chat/chat.service';
import { ConversationController } from './modules/conversation/conversation.controller';
import { ConversationService } from './modules/conversation/conversation.service';
import { ChatGateway } from './modules/chat/gateways/chat.gateway';
import { CallGateway } from './modules/chat/gateways/call.gateway';
import { OnlineUserService } from './modules/chat/online-user.service';

@Module({
  imports: [AuthModule, PrismaModule, JwtModule, FriendModule, UserModule],
  controllers: [AppController, ConversationController],
  providers: [AppService, ChatService, ConversationService, ChatGateway, CallGateway, OnlineUserService],
})
export class AppModule { }


