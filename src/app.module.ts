import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtModule } from './jwt/jwt.module';
import { FriendModule } from './friend/friend.module';
import { UserModule } from './user/user.module';
import { ChatService } from './chat/chat.service';

@Module({
  imports: [AuthModule, PrismaModule, JwtModule, FriendModule, UserModule],
  controllers: [AppController],
  providers: [AppService, ChatService],
})
export class AppModule { }


