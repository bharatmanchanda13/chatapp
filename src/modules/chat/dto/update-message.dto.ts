import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export enum MessageType {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    AUDIO = 'AUDIO',
    FILE = 'FILE',
}

export class UpdateMessageDto {
    @IsInt()
    messageId: number;

    @IsInt()
    userId: number;

    @IsString()
    content: string;
}