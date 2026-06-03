import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class ConversationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly chatService: ChatService
    ) { }
    async getList(userId: number) {
        const conversations = await this.prisma.conversation.findMany({
            where: {
                participants: {
                    some: {
                        userId: userId
                    }
                }
            },

            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                // profileImage: true
                            }
                        }
                    }
                },

                messages: {
                    orderBy: {
                        createdAt: "desc"
                    },
                    take: 1
                }
            },

            orderBy: {
                updatedAt: "desc"
            }
        });

        const blocks = await this.prisma.userBlock.findMany({
            where: {
                OR: [
                    { blockerId: userId },
                    { blockedId: userId }
                ]
            }
        });

        const blockedByMeIds = new Set<number>();
        const blockedMeIds = new Set<number>();
        blocks.forEach(b => {
            if (b.blockerId === userId) blockedByMeIds.add(b.blockedId);
            if (b.blockedId === userId) blockedMeIds.add(b.blockerId);
        });

        return conversations.map(c => {
            const otherParticipant = c.participants.find(p => p.userId !== userId);
            const otherUserId = otherParticipant ? otherParticipant.userId : null;
            const blockedByMe = otherUserId ? blockedByMeIds.has(otherUserId) : false;
            const blockedMe = otherUserId ? blockedMeIds.has(otherUserId) : false;
            const isBlocked = blockedByMe || blockedMe;
            return {
                ...c,
                isBlock: isBlocked,
                isBlocked: isBlocked,
                blockedByMe,
                blockedMe
            };
        });
    }

    async findOrCreateDirectConversation(userId: number, participantId: number) {
        if (await this.chatService.isBlocked(userId, participantId)) {
            throw new BadRequestException('You are blocked by this user');
        }
        const existingConversation = await this.prisma.conversation.findFirst({
            where: {
                type: 'DIRECT',
                AND: [
                    {
                        participants: {
                            some: {
                                userId: userId
                            }
                        }
                    },
                    {
                        participants: {
                            some: {
                                userId: participantId
                            }
                        }
                    }
                ]
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                messages: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            }
        });

        if (existingConversation) {
            const blocks = await this.prisma.userBlock.findMany({
                where: {
                    OR: [
                        { blockerId: userId, blockedId: participantId },
                        { blockerId: participantId, blockedId: userId }
                    ]
                }
            });
            const blockedByMe = blocks.some(b => b.blockerId === userId && b.blockedId === participantId);
            const blockedMe = blocks.some(b => b.blockerId === participantId && b.blockedId === userId);
            const isBlock = blockedByMe || blockedMe;

            return {
                ...existingConversation,
                isBlock,
                isBlocked: isBlock,
                blockedByMe,
                blockedMe
            };
        }

        // 2. Otherwise create a new direct conversation
        const newConversation = await this.prisma.conversation.create({
            data: {
                type: 'DIRECT',
                participants: {
                    create: [
                        { userId: userId },
                        { userId: participantId }
                    ]
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                messages: {
                    take: 1
                }
            }
        });

        const blocks = await this.prisma.userBlock.findMany({
            where: {
                OR: [
                    { blockerId: userId, blockedId: participantId },
                    { blockerId: participantId, blockedId: userId }
                ]
            }
        });
        const blockedByMe = blocks.some(b => b.blockerId === userId && b.blockedId === participantId);
        const blockedMe = blocks.some(b => b.blockerId === participantId && b.blockedId === userId);
        const isBlock = blockedByMe || blockedMe;

        return {
            ...newConversation,
            isBlock,
            isBlocked: isBlock,
            blockedByMe,
            blockedMe
        };
    }

    async getDetails(conversationId: number, userId: number, userRole?: string) {
        const conversation = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                participants: {
                    some: {
                        userId: userId
                    }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                messages: {
                    orderBy: {
                        createdAt: 'asc'
                    },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        if (userRole !== 'ADMIN') {
            conversation.participants.forEach((p: any) => {
                if (p.user && p.userId !== userId) {
                    p.user.email = null;
                }
            });
        }

        const otherParticipant = conversation.participants.find(p => p.userId !== userId);
        let blockedByMe = false;
        let blockedMe = false;
        if (otherParticipant) {
            const blocks = await this.prisma.userBlock.findMany({
                where: {
                    OR: [
                        { blockerId: userId, blockedId: otherParticipant.userId },
                        { blockerId: otherParticipant.userId, blockedId: userId }
                    ]
                }
            });
            blockedByMe = blocks.some(b => b.blockerId === userId && b.blockedId === otherParticipant.userId);
            blockedMe = blocks.some(b => b.blockerId === otherParticipant.userId && b.blockedId === userId);
        }
        const isBlock = blockedByMe || blockedMe;

        return {
            ...conversation,
            isBlock,
            isBlocked: isBlock,
            blockedByMe,
            blockedMe
        };
    }
}
