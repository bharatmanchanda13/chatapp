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

@Module({
  imports: [AuthModule, PrismaModule, JwtModule, FriendModule, UserModule],
  controllers: [AppController, ConversationController],
  providers: [AppService, ChatService, ConversationService],
})
export class AppModule { }


