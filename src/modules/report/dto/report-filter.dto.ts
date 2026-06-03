import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { ReportType, ReportStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class ReportFilterDto {
    @IsEnum(ReportStatus)
    @IsOptional()
    status?: ReportStatus;

    @IsEnum(ReportType)
    @IsOptional()
    reportType?: ReportType;

    @Type(() => Number)
    @IsInt()
    @IsOptional()
    page?: number;

    @Type(() => Number)
    @IsInt()
    @IsOptional()
    limit?: number;
}
