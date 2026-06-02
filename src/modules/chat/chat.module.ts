import { Module } from '@nestjs/common';
import { OnlineUserService } from './online-user.service';

@Module({
  providers: [OnlineUserService],
  exports: [OnlineUserService],
})
export class ChatModule {}
