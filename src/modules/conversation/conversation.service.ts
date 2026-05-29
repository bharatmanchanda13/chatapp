import { Injectable } from '@nestjs/common';
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
}
