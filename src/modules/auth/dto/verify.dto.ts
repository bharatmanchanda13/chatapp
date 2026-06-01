import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  MinLength,
} from 'class-validator';
import { Purpose } from './send-otp.dto';

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsEnum(Purpose)
  purpose: Purpose;

  @ValidateIf(
    (o) => o.purpose === Purpose.EMAIL_VERIFICATION,
  )
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ValidateIf(
    (o) => o.purpose === Purpose.EMAIL_VERIFICATION,
  )
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ValidateIf(
    (o) => o.purpose === Purpose.EMAIL_VERIFICATION,
  )
  @IsString()
  @MinLength(6)
  password?: string;

  @ValidateIf(
    (o) => o.purpose === Purpose.EMAIL_VERIFICATION,
  )
  @IsString()
  @MinLength(6)
  confirmPassword?: string;
}