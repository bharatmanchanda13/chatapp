import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationService {
    constructor(private readonly prisma: PrismaService) {}
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
        })
        return conversations;
    }

    async findOrCreateDirectConversation(userId: number, participantId: number) {
        // 1. Find if a DIRECT conversation with both participants already exists
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
            return existingConversation;
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

        return newConversation;
    }

    async getDetails(conversationId: number, userId: number) {
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

        return conversation;
    }
}
