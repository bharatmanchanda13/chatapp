import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

import { OnlineUserService } from '../online-user.service';
import { ChatService } from '../chat.service';
import { CALL_EVENTS } from '../events';

import type { SocketUser } from '../interfaces/socket-user.interface';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class CallGateway {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly onlineUserService: OnlineUserService,
        private readonly chatService: ChatService,
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
        this.emitToUser(data.to, CALL_EVENTS.CALL_MADE, {
                offer: data.offer,
                from: senderId,
                callerName:
                data.callerName ?? 'Someone',
                type: data.type ?? 'audio',
            },
        );

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
            }
        }

        this.emitToUser(data.to, CALL_EVENTS.CALL_ENDED, {
            from: senderId,
        });

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

        return { success: true };
    }
}