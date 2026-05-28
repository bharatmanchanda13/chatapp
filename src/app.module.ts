import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { FriendModule } from './modules/friend/friend.module';
import { UserModule } from './modules/user/user.module';
import { ChatService } from './modules/chat/chat.service';

@Module({
  imports: [AuthModule, PrismaModule, JwtModule, FriendModule, UserModule],
  controllers: [AppController],
  providers: [AppService, ChatService],
})
export class AppModule { }


