import { IsEmail, IsEnum } from "class-validator";

export enum Purpose {
    EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
    PHONE_VERIFICATION = 'PHONE_VERIFICATION',
    FORGOT_PASSWORD = 'FORGOT_PASSWORD'
}

export class SendOtpDto {
    @IsEmail()
    email: string;

    @IsEnum(Purpose)
    purpose: Purpose;
}