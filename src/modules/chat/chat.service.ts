import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { MessageStatus, MessageType, NotificationType } from '@prisma/client';
import { OnlineUserService } from './online-user.service';

@Injectable()
export class ChatService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService,
        private readonly onlineUserService: OnlineUserService,
    ) {}

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

        const participants = await this.prisma.conversationParticipant.findMany({
            where: {
                conversationId: dto.conversationId,
            },
            select: {
                userId: true,
            },
        });
        const otherUser = participants.find((p) => p.userId !== dto.senderId);

        if (!otherUser) {
            throw new ForbiddenException('Conversation participant not found');
        }

        if (await this.isBlocked(dto.senderId, otherUser.userId)) {
            throw new ForbiddenException('Messaging is not allowed because one user has blocked the other');
        }

        const message = await this.prisma.message.create({
            data: {
                conversationId: dto.conversationId,
                senderId: dto.senderId,
                content: dto.content,
                type: dto.type || MessageType.TEXT,
                statuses: {
                    create: participants.map((p) => {
                        const isSender = p.userId === dto.senderId;
                        const isUserOnline = this.onlineUserService.isOnline(p.userId);
                        
                        const status = isSender
                            ? MessageStatus.SENT
                            : (isUserOnline ? MessageStatus.DELIVERED : MessageStatus.SENT);
                        const deliveredAt = (!isSender && isUserOnline) ? new Date() : null;

                        return {
                            userId: p.userId,
                            status,
                            deliveredAt,
                        };
                    }),
                },
            },

            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                statuses: true,
            },
        });

        this.notificationService.sendAndSave(otherUser.userId, `New message from ${message.sender.name}`,
            dto.content,
            NotificationType.NEW_MESSAGE,
            {
                conversationId: String(dto.conversationId),
                messageId: String(message.id),
                senderId: String(dto.senderId),
            }
        ).catch((err) => console.error('Failed to send new message notification:', err));

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
                        statuses: true,
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

        const updatedTracking = await this.prisma.messageTrackingStatus.upsert({
            where: {
                messageId_userId: {
                    messageId,
                    userId,
                },
            },
            update: {
                status: MessageStatus.READ,
                readAt: new Date(),
            },
            create: {
                messageId,
                userId,
                status: MessageStatus.READ,
                readAt: new Date(),
            },
        });

        return {
            success: true,
            message: 'Message marked as read',
            messageId: message.id,
            conversationId: message.conversationId,
            status: updatedTracking.status,
        };
    }

    async getConversationParticipants(conversationId: number) {
        return this.prisma.conversationParticipant.findMany({
            where: {
                conversationId,
            },
            select: {
                userId: true,
            },
        });
    }

    async isBlocked(userA: number, userB: number) {
        const block = await this.prisma.userBlock.findFirst({
            where: {
                OR: [
                    {
                        blockerId: userA,
                        blockedId: userB,
                     },
                    {
                        blockerId: userB,
                        blockedId: userA,
                    },
                ],
            },
        });

        return !!block;
    }

    async markMessagesAsDelivered(userId: number) {
        // Find all tracking statuses for this user that are currently SENT
        const undeliveredStatuses = await this.prisma.messageTrackingStatus.findMany({
            where: {
                userId,
                status: MessageStatus.SENT,
            },
            include: {
                message: {
                    select: {
                        id: true,
                        senderId: true,
                        conversationId: true,
                    },
                },
            },
        });

        if (undeliveredStatuses.length === 0) return [];

        // Update all these statuses to DELIVERED
        const idsToUpdate = undeliveredStatuses.map((s) => s.id);
        await this.prisma.messageTrackingStatus.updateMany({
            where: {
                id: {
                    in: idsToUpdate,
                },
            },
            data: {
                status: MessageStatus.DELIVERED,
                deliveredAt: new Date(),
            },
        });

        return undeliveredStatuses;
    }
}
