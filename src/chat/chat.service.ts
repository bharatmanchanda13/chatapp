import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MessageType, SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

export enum MessageStatus {
    SENT = 'SENT',
    DELIVERED = 'DELIVERED',
    READ = 'READ',
}
@Injectable()
export class ChatService {
    constructor(private readonly prisma: PrismaService) {}

    async sendMessage(dto: SendMessageDto) {
        const participant = await this.prisma.conversationParticipant.findFirst({
            where: {
                conversationId: dto.conversationId,
                userId: dto.senderId,
            },
        });

        if (!participant) {
            throw new ForbiddenException('You are not part of this conversation');
        }

        const message = await this.prisma.message.create({
            data: {
                conversationId: dto.conversationId,
                senderId: dto.senderId,
                content: dto.content,
                type: dto.type || MessageType.TEXT,
                status: MessageStatus.SENT,
            },

            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return message;
    }

    async updateMessage(dto: UpdateMessageDto) {
        const message = await this.prisma.message.findUnique({
            where: {
                id: dto.messageId,
            },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        if (message.senderId !== dto.userId) {
            throw new ForbiddenException('You can only edit your own message');
        }

        const updatedMessage = await this.prisma.message.update({
            where: {
                id: dto.messageId,
            },
            data: {
                content: dto.content,
            },
        });

        return updatedMessage;
    }

    async deleteMessage(messageId: number, userId: number) {
        const message = await this.prisma.message.findUnique({
            where: {
                id: messageId,
            },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        if (message.senderId !== userId) {
            throw new ForbiddenException('You can only delete your own message');
        }

        await this.prisma.message.delete({
            where: {
                id: messageId,
            }
        });

        return {
            success: true,
            message: 'Message deleted',
        };
    }

    async getUserConversations(userId: number) {
        return this.prisma.conversation.findMany({
            where: {
                participants: {
                    some: {
                        userId,
                    },
                },
            },

            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },

                messages: {
                    take: 1,

                    orderBy: {
                        createdAt: 'desc',
                    },

                    include: {
                        sender: {
                        select: {
                            id: true,
                            name: true,
                        },
                        },
                    },
                },
            },

            orderBy: {
                updatedAt: 'desc',
            },
        });
    }

    async markAsRead(messageId: number, userId: number) {
        const message = await this.prisma.message.findUnique({
            where: {
                id: messageId,
            },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        if (message.senderId === userId) {
            throw new ForbiddenException('You cannot mark your own message as read');
        }

        await this.prisma.message.update({
            where: {
                id: messageId,
            },
            data: {
                status: MessageStatus.READ,
            },
        });

        return {
            success: true,
            message: 'Message marked as read',
        };
    }
}
