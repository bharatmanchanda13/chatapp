import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { FriendRequestAction } from './dto/respond-friend-request.dto';
import { ChatService } from '../chat/chat.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/create-notification.enum';

@Injectable()
export class FriendService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly chatService: ChatService,
        private readonly notificationService: NotificationService,
    ) {}
    async sendFriendRequest(senderId: number, receiverId: number) {
        if (senderId === receiverId) {
            throw new BadRequestException('Cannot send request to yourself');
        }

        if (await this.chatService.isBlocked(senderId, receiverId)) {
            throw new BadRequestException('You are blocked by this user');
        }

        const receiver = await this.prisma.user.findUnique({
            where: {
                id: receiverId,
            },
        });

        if (!receiver) {
            throw new NotFoundException('Receiver not found');
        }
        const existingRequest = await this.prisma.friendRequest.findFirst({
            where: {
                OR: [
                    {
                        senderId,
                        receiverId,
                    },
                    {
                        senderId: receiverId,
                        receiverId: senderId,
                    },
                ],
            },
        });

        if (existingRequest) {
            throw new BadRequestException('Friend request already exists');
        }

        const friendRequest = await this.prisma.friendRequest.create({
            data: {
                senderId,
                receiverId
            }
        });

        // Send friend request notification
        try {
            const sender = await this.prisma.user.findUnique({
                where: { id: senderId },
                select: { name: true },
            });
            this.notificationService.sendAndSave(
                receiverId,
                'New Friend Request',
                `${sender?.name || 'Someone'} sent you a friend request.`,
                NotificationType.FRIEND_REQUEST,
                {
                    senderId: String(senderId),
                }
            ).catch(err => console.error('Failed to send friend request notification:', err));
        } catch (error) {
            console.error('Failed to fetch sender or trigger friend request notification:', error);
        }

        return friendRequest;
    }


    // Accept / Decline Request
    async updateFriendRequest(requestId: number, userId: number, status: FriendRequestAction) {
        const result = await this.prisma.$transaction(
            async (tx) => {

                const request = await tx.friendRequest.findUnique({
                        where: {
                            id: requestId,
                        },
                    });

                if (!request) {
                    throw new NotFoundException('Friend request not found');
                }

                if (request.status !== 'PENDING') {
                    throw new BadRequestException('Request already handled');
                }

                if (status === FriendRequestAction.ACCEPTED) {
                    if (request.receiverId !== userId) {
                        throw new BadRequestException('Unauthorized action');
                    }

                    const updatedRequest = await tx.friendRequest.update({
                        where: {
                            id: requestId,
                        },

                        data: {
                            status,
                        },
                    });

                    const userOneId = Math.min(request.senderId, request.receiverId);
                    const userTwoId = Math.max(request.senderId, request.receiverId);

                    const existingFriendship = await tx.friendship.findFirst({
                        where: {
                            userOneId,
                            userTwoId,
                        },
                    });

                    if (!existingFriendship) {
                        await tx.friendship.create({
                            data: {
                                userOneId,
                                userTwoId,
                            },
                        });
                    }
                    return { updatedRequest, senderId: request.senderId, receiverId: request.receiverId };
                }

                if (status === FriendRequestAction.CANCELLED) {
                    if (request.senderId !== userId && request.receiverId !== userId) {
                        throw new BadRequestException('Unauthorized action');
                    }
                    await tx.friendRequest.delete({
                        where: {
                            id: requestId,
                        },
                    });
                    return {
                        message: 'Friend request cancelled',
                    };
                }

                throw new BadRequestException('Invalid action');
            },
        );

        if (status === FriendRequestAction.ACCEPTED && result && 'updatedRequest' in result) {
            const res = result as { updatedRequest: any; senderId: number; receiverId: number };
            try {
                const receiver = await this.prisma.user.findUnique({
                    where: { id: res.receiverId },
                    select: { name: true },
                });
                this.notificationService.sendAndSave(
                    res.senderId,
                    'Friend Request Accepted',
                    `${receiver?.name || 'Someone'} accepted your friend request.`,
                    NotificationType.FRIEND_REQUEST,
                    {
                        receiverId: String(res.receiverId),
                        requestId: String(requestId),
                        accepted: 'true',
                    }
                ).catch(err => console.error('Failed to send friend request accepted notification:', err));
            } catch (error) {
                console.error('Failed to send notification for friend request acceptance:', error);
            }
            return res.updatedRequest;
        }

        return result;
    }

    async getFriendRequests(userId: number) {
        return await this.prisma.friendRequest.findMany({
            where: {
                receiverId: userId,
                status: 'PENDING',
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    async getFriends(userId: number) {
        const friendships = await this.prisma.friendship.findMany({
            where: {
                OR: [
                    { userOneId: userId },
                    { userTwoId: userId },
                ],
            },
            include: {
                userOne: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                userTwo: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return friendships.map((f) => {
            const friend = f.userOne.id === userId ? f.userTwo : f.userOne;
            return {
                id: friend.id,
                name: friend.name,
                friendshipId: f.id,
            };
        });
    }

    async getFriendDetails(userId: number, friendId: number) {
        const friendship = await this.prisma.friendship.findFirst({
            where: {
                id: friendId
            }
        });

        if (!friendship) {
            throw new NotFoundException('Friend not found');
        }

        const friend = await this.prisma.user.findUnique({
            where: {
                id: friendship.userOneId === userId ? friendship.userTwoId : friendship.userOneId,
            },
        });

        if (!friend) {
            throw new NotFoundException('Friend not found');
        }

        const { password, accessTokens, refreshTokens, role, email, phone, ...friendData } = friend;
        return {
            ...friendData,
        };
    }

    async unfriend(currentUserId: number, friendId: number) {
        const friendship = await this.prisma.friendship.findFirst({
            where: {
                id: friendId,
                OR: [
                    { userOneId: currentUserId },
                    { userTwoId: currentUserId },
                ]
            },
        });

        if (!friendship) {
            throw new NotFoundException('Friendship not found');
        }

        await this.prisma.friendship.delete({
            where: {
                id: friendId,
                OR: [
                    { userOneId: currentUserId },
                    { userTwoId: currentUserId },
                ]
            },
        });

        return {
            message: 'User unfriended successfully',
        };
    }
}
