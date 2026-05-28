import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export enum MessageType {
	TEXT = 'TEXT',
	IMAGE = 'IMAGE',
	VIDEO = 'VIDEO',
	AUDIO = 'AUDIO',
	FILE = 'FILE',
}

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