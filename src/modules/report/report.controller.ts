import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportFilterDto } from './dto/report-filter.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Role } from '@prisma/client';

@Controller('report')
export class ReportController {
    constructor(private readonly reportService: ReportService) {}

    // User submits a report
    @UseGuards(AuthGuard)
    @Post()
    async createReport(@Req() req: any, @Body() dto: CreateReportDto) {
        return this.reportService.createReport(req.user.id, dto);
    }

    // Admin lists all reports
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Get()
    async getList(@Query() dto: ReportFilterDto) {
        return this.reportService.getList(dto);
    }

    // Admin gets single report details
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Get(':id')
    async getOne(@Param('id', ParseIntPipe) id: number) {
        return this.reportService.getOne(id);
    }

    // Admin updates report status
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateReportDto,
    ) {
        return this.reportService.update(id, dto);
    }

    // Admin deletes a report
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Delete(':id')
    async delete(@Param('id', ParseIntPipe) id: number) {
        return this.reportService.delete(id);
    }
}
