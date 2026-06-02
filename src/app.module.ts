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
import { ChatModule } from './modules/chat/chat.module';
import { ProfileController } from './modules/profile/profile.controller';
import { ProfileService } from './modules/profile/profile.service';
import { ScheduleModule } from '@nestjs/schedule';
import { OtpCleanupService } from './common/cronjob/otp-cleanup.service';
import { NotificationModule } from './modules/notification/notification.module';
import { MediaController } from './modules/media/media.controller';
import { MediaService } from './modules/media/media.service';
import { S3Service } from './modules/media/s3.service';
import { AlbumService } from './modules/album/album.service';
import { AlbumController } from './modules/album/album.controller';

@Module({
  imports: [AuthModule, PrismaModule, JwtModule, FriendModule, UserModule, ChatModule, ScheduleModule.forRoot(), NotificationModule,],
  controllers: [AppController, ConversationController, ProfileController, MediaController, AlbumController],
  providers: [AppService, ChatService, ConversationService, ChatGateway, CallGateway, ProfileService, OtpCleanupService, MediaService, S3Service, AlbumService],
})
export class AppModule { }



