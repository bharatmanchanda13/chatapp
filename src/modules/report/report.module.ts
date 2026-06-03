import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '../jwt/jwt.module';
import { PaginationService } from 'src/common/pagination/pagination.service';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [ReportController],
  providers: [ReportService, PaginationService],
  exports: [ReportService]
})
export class ReportModule {}
