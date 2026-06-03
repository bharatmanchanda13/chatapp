import { Platform } from "@prisma/client";
import { IsEnum, IsString } from "class-validator";

export class RegisterDeviceDto {
    @IsString()
    fcmToken: string;

    @IsString()
    deviceId: string;

    @IsEnum(Platform)
    platform: Platform;
}