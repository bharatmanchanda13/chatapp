import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ReportType, ReportReason } from '@prisma/client';

export class CreateReportDto {
    @IsInt()
    @IsNotEmpty()
    reportedId: number;

    @IsEnum(ReportType)
    @IsNotEmpty()
    reportType: ReportType;

    @IsEnum(ReportReason)
    @IsNotEmpty()
    reason: ReportReason;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    messageId?: string;

    @IsString()
    @IsOptional()
    photoId?: string;
}
