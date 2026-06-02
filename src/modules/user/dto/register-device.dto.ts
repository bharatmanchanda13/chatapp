
// enum 

import { IsEnum, IsString } from "class-validator";

export enum Platform {
    ANDROID = 'ANDROID',
    IOS = 'IOS',
    WEB = 'WEB',
}
export class RegisterDeviceDto {
    @IsString()
    fcmToken: string;

    @IsString()
    deviceId: string;

    @IsEnum(Platform)
    platform: Platform;
}