import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportFilterDto } from './dto/report-filter.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';

@Injectable()
export class ReportService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: PaginationService,
    ) {}

    async createReport(reporterId: number, dto: CreateReportDto) {
        if (reporterId === dto.reportedId) {
            throw new BadRequestException('You cannot report yourself');
        }

        const reportedUser = await this.prisma.user.findUnique({
            where: { id: dto.reportedId },
        });

        if (!reportedUser) {
            throw new NotFoundException('Reported user not found');
        }

        return this.prisma.report.create({
            data: {
                reporterId,
                reportedId: dto.reportedId,
                reportType: dto.reportType,
                reason: dto.reason,
                description: dto.description || null,
                messageId: dto.messageId || null,
                photoId: dto.photoId || null,
            },
        });
    }

    async getList(dto: ReportFilterDto) {
        const where: any = {};
        if (dto.status) {
            where.status = dto.status;
        }
        if (dto.reportType) {
            where.reportType = dto.reportType;
        }

        return this.paginationService.paginate(this.prisma.report, {
            page: dto.page,
            limit: dto.limit,
            where,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                reporter: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                reportedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    async getOne(id: number) {
        const report = await this.prisma.report.findUnique({
            where: { id },
            include: {
                reporter: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                reportedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!report) {
            throw new NotFoundException('Report not found');
        }

        return report;
    }

    async update(id: number, dto: UpdateReportDto) {
        const report = await this.prisma.report.findUnique({
            where: { id },
        });

        if (!report) {
            throw new NotFoundException('Report not found');
        }

        return this.prisma.report.update({
            where: { id },
            data: {
                status: dto.status,
            },
        });
    }

    async delete(id: number) {
        const report = await this.prisma.report.findUnique({
            where: { id },
        });

        if (!report) {
            throw new NotFoundException('Report not found');
        }

        return this.prisma.report.delete({
            where: { id },
        });
    }
}
