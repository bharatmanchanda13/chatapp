import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '../jwt/jwt.module';
import { AuthModule } from '../auth/auth.module';
import { PaginationService } from 'src/common/pagination/pagination.service';

@Module({
  imports: [PrismaModule, JwtModule, AuthModule],
  controllers: [UserController],
  providers: [UserService, PaginationService]
})
export class UserModule {}
