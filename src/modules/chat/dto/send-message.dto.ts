import { MessageType } from '@prisma/client';
import { IsEnum, IsInt, IsString } from 'class-validator';

export class SendMessageDto {
    @IsInt()
    conversationId: number;

    @IsInt()
    senderId: number;

    @IsString()
    content: string;

    @IsEnum(MessageType)
    type: MessageType;
}