import { IsString } from 'class-validator';

export class SendNotificationDto {
  @IsString()
  userId: number;

  @IsString()
  title: string;

  @IsString()
  body: string;
}