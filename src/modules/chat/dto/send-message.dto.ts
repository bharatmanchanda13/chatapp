import { MessageType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
    @IsOptional()
    @IsInt()
    conversationId: number;

    @IsInt()
    senderId: number;

    @IsOptional()
    @IsInt()
    receiverId: number;

    @IsString()
    content: string;

    @IsEnum(MessageType)
    type: MessageType;
}