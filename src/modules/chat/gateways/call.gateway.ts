import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

import { OnlineUserService } from '../online-user.service';
import { ChatService } from '../chat.service';
import { CALL_EVENTS, CHAT_EVENTS } from '../events';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationService } from '../../conversation/conversation.service';
import { NotificationService } from '../../notification/notification.service';

import type { SocketUser } from '../interfaces/socket-user.interface';
import { NotificationType } from '@prisma/client';

interface CallSession {
    callerId: number;
    receiverId: number;
    type: 'audio' | 'video';
    startedAt?: Date;
    createdAt: Date;
}

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class CallGateway implements OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private activeCalls = new Map<number, CallSession>();

    constructor(
        private readonly onlineUserService: OnlineUserService,
        private readonly chatService: ChatService,
        private readonly prisma: PrismaService,
        private readonly conversationService: ConversationService,
        private readonly notificationService: NotificationService,
    ) {}

    private getSenderId(
        client: SocketUser,
    ): number | null {
        return (
            client.user?.id ??
            this.onlineUserService.getUserId(client.id) ??
            null
        );
    }

    private emitToUser(
        userId: number,
        event: string,
        payload: unknown,
    ): void {
        this.server.to(`user:${userId}`).emit(event, payload);
    }

    private isUserOffline(
        userId: number,
    ): boolean {
        return !this.onlineUserService.isOnline(userId);
    }

    @SubscribeMessage(CALL_EVENTS.CALL_USER)
    async handleCallUser(
        @MessageBody() data: {
            to: number;
            offer: RTCSessionDescriptionInit;
            callerName?: string;
            type?: 'audio' | 'video';
        },
        @ConnectedSocket() client: SocketUser,
    ) {
        const senderId = this.getSenderId(client);
        if (!senderId) {
            return {
                success: false,
                error: 'Caller not identified',
            };
        }
        if (
        await this.chatService.isBlocked(
            senderId,
            data.to,
        )
        ) {
            return {
                success: false,
                error: 'You cannot call this user',
            };
        }
        if (this.isUserOffline(data.to)) {
            return {
                success: false,
                error: 'User is offline',
            };
        }

        // Clean up any stale sessions for both caller and receiver
        const existingCallerSession = this.findCallSession(senderId);
        if (existingCallerSession) {
            this.activeCalls.delete(existingCallerSession.callerId);
        }
        const existingReceiverSession = this.findCallSession(data.to);
        if (existingReceiverSession) {
            this.activeCalls.delete(existingReceiverSession.callerId);
        }

        this.emitToUser(data.to, CALL_EVENTS.CALL_MADE, {
                offer: data.offer,
                from: senderId,
                callerName:
                data.callerName ?? 'Someone',
                type: data.type ?? 'audio',
            },
        );

        // Store call session in activeCalls map
        this.activeCalls.set(senderId, {
            callerId: senderId,
            receiverId: data.to,
            type: data.type ?? 'audio',
            createdAt: new Date(),
        });

        return { success: true };
    }

    @SubscribeMessage(CALL_EVENTS.ANSWER_CALL)
    async handleAnswerCall(
        @MessageBody()
        data: {
        to: number;
        answer: RTCSessionDescriptionInit;
        },
        @ConnectedSocket()
        client: SocketUser,
    ) {
        const senderId = this.getSenderId(client);

        if (!senderId) {
            return {
                success: false,
                error: 'Receiver not identified',
            };
        }

        if (this.isUserOffline(data.to)) {
            return {
                success: false,
                error: 'User is offline',
            };
        }

        this.emitToUser(data.to, CALL_EVENTS.CALL_ANSWERED,
            {
                answer: data.answer,
                from: senderId,
            },
        );

        // Set the start time of the call
        const session = this.activeCalls.get(data.to);
        if (session && session.receiverId === senderId) {
            session.startedAt = new Date();
        }

        return { success: true };
    }

    @SubscribeMessage(CALL_EVENTS.ICE_CANDIDATE)
    async handleIceCandidate(@MessageBody() data: {
            to: number;
            candidate: RTCIceCandidateInit;
        },
        @ConnectedSocket()
        client: SocketUser,
    ) {
        const senderId = this.getSenderId(client);

        if (!senderId) {
            return {
                success: false,
                error: 'Sender not identified',
            }
        }

        if (this.isUserOffline(data.to)) {
            return {
                success: false,
                error: 'User is offline',
            }
        }

        this.emitToUser(data.to, CALL_EVENTS.ICE_CANDIDATE_RECEIVED, {
            candidate: data.candidate,
            from: senderId,
        });

        return { success: true };
    }

    @SubscribeMessage(CALL_EVENTS.END_CALL)
    async handleEndCall(@MessageBody() data: {
            to: number;
        },
        @ConnectedSocket() client: SocketUser,
    ) {
        const senderId = this.getSenderId(client);

        if (!senderId) {
            return {
                success: false,
                error: 'Sender not identified',
            };
        }

        this.emitToUser(data.to, CALL_EVENTS.CALL_ENDED, {
            from: senderId,
        });

        // Log call details and clean up
        const foundResult = this.findCallSession(senderId);
        if (foundResult) {
            const { session, callerId } = foundResult;
            const callTypeStr = session.type === 'video' ? 'video' : 'voice';
            if (session.startedAt) {
                // Call was answered, calculate duration
                const durationMs = new Date().getTime() - session.startedAt.getTime();
                const durationMin = Math.max(1, Math.ceil(durationMs / 60000));
                const callLabel = session.type === 'video' ? 'Video call' : 'Voice call';
                const content = `${callLabel} (${durationMin} min)`;
                await this.saveCallMessage(session.callerId, session.receiverId, content);
            } else {
                // Call was not answered (missed call)
                const content = `Missed ${callTypeStr} call`;
                await this.saveCallMessage(session.callerId, session.receiverId, content);
            }
            this.activeCalls.delete(callerId);
        }

        return { success: true };
    }

    @SubscribeMessage(CALL_EVENTS.REJECT_CALL)
    async handleRejectCall(@MessageBody() data: {
            to: number;
        },
        @ConnectedSocket() client: SocketUser,
    ) {
        const senderId = this.getSenderId(client);

        if (!senderId) {
            return {
                success: false,
                error: 'Sender not identified',
            };
        }

        this.emitToUser(data.to, CALL_EVENTS.CALL_REJECTED, {
            from: senderId,
        });

        // Log missed call and clean up
        const found = this.activeCalls.get(data.to) || this.findCallSession(senderId)?.session;
        if (found) {
            const callTypeStr = found.type === 'video' ? 'video' : 'voice';
            const content = `Missed ${callTypeStr} call`;
            await this.saveCallMessage(found.callerId, found.receiverId, content);
            this.activeCalls.delete(found.callerId);
        }

        return { success: true };
    }

    @SubscribeMessage(CALL_EVENTS.CANCEL_CALL)
    async handleCancelCall(@MessageBody() data: { to: number }, @ConnectedSocket() client: SocketUser) {
        const senderId = this.getSenderId(client);

        if (!senderId) {
            return {
                success: false,
                error: 'Sender not identified',
            };
        }

        this.emitToUser(data.to, CALL_EVENTS.CALL_CANCELLED, {
            from: senderId,
        });

        // Log missed call and clean up
        const found = this.activeCalls.get(senderId) || this.findCallSession(senderId)?.session;
        if (found) {
            const callTypeStr = found.type === 'video' ? 'video' : 'voice';
            const content = `Missed ${callTypeStr} call`;
            await this.saveCallMessage(found.callerId, found.receiverId, content);
            this.activeCalls.delete(found.callerId);
        }

        return { success: true };
    }

    private findCallSession(userId: number): { session: CallSession; callerId: number } | null {
        for (const [callerId, session] of this.activeCalls.entries()) {
            if (session.callerId === userId || session.receiverId === userId) {
                return { session, callerId };
            }
        }
        return null;
    }

    private async saveCallMessage(callerId: number, receiverId: number, content: string): Promise<void> {
        try {
            const conversation = await this.conversationService.findOrCreateDirectConversation(callerId, receiverId);
            const message = await this.prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    senderId: callerId,
                    content: content,
                    type: 'TEXT',
                    status: 'SENT',
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

            // Update conversation updatedAt to bubble it up
            await this.prisma.conversation.update({
                where: { id: conversation.id },
                data: { updatedAt: new Date() },
            });

            // Emit to conversation room
            this.server
                .to(`conversation:${conversation.id}`)
                .emit(CHAT_EVENTS.RECEIVE_MESSAGE, message);

            // Emit to individual user rooms to update general UI
            this.server.to(`user:${callerId}`).emit(CHAT_EVENTS.RECEIVE_MESSAGE, message);
            this.server.to(`user:${receiverId}`).emit(CHAT_EVENTS.RECEIVE_MESSAGE, message);

            // Send notification
            if (content.toLowerCase().includes('missed')) {
                this.notificationService.sendAndSave(
                    receiverId,
                    `Missed call`,
                    content,
                    NotificationType.CALL_MISSED,
                    {
                        conversationId: String(conversation.id),
                        messageId: String(message.id),
                        senderId: String(callerId),
                    }
                ).catch((err) => console.error('Failed to send missed call notification:', err));
            } else {
                this.notificationService.sendAndSave(
                    receiverId,
                    `New message from ${message.sender.name}`,
                    content,
                    NotificationType.NEW_MESSAGE,
                    {
                        conversationId: String(conversation.id),
                        messageId: String(message.id),
                        senderId: String(callerId),
                    }
                ).catch((err) => console.error('Failed to send call end message notification:', err));
            }
        } catch (error) {
            console.error('Failed to save or broadcast call message:', error);
        }
    }

    async handleDisconnect(client: SocketUser) {
        const userId = this.getSenderId(client);
        if (!userId) {
            return;
        }

        const foundResult = this.findCallSession(userId);
        if (foundResult) {
            const { session, callerId } = foundResult;
            const callTypeStr = session.type === 'video' ? 'video' : 'voice';
            const otherUserId = session.callerId === userId ? session.receiverId : session.callerId;

            // Notify the other peer that the call was ended
            this.emitToUser(otherUserId, CALL_EVENTS.CALL_ENDED, {
                from: userId,
            });

            if (session.startedAt) {
                // Call was answered, calculate duration
                const durationMs = new Date().getTime() - session.startedAt.getTime();
                const durationMin = Math.max(1, Math.ceil(durationMs / 60000));
                const callLabel = session.type === 'video' ? 'Video call' : 'Voice call';
                const content = `${callLabel} (${durationMin} min)`;
                await this.saveCallMessage(session.callerId, session.receiverId, content);
            } else {
                // Call was not answered (missed call)
                const content = `Missed ${callTypeStr} call`;
                await this.saveCallMessage(session.callerId, session.receiverId, content);
            }
            this.activeCalls.delete(callerId);
        }
    }
}