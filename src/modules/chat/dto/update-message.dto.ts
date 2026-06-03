import { IsInt, IsString } from 'class-validator';

export class UpdateMessageDto {
    @IsInt()
    messageId: number;

    @IsInt()
    userId: number;

    @IsString()
    content: string;
}