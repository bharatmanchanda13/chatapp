import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { ChatService } from '../chat.service';
import { OnlineUserService } from '../online-user.service';
import { CHAT_EVENTS } from '../events';
import { SendMessageDto } from '../dto/send-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import type { SocketUser } from '../interfaces/socket-user.interface';
import { JoinUserDto } from '../dto/join-user.dto';
import { ForbiddenException } from '@nestjs/common';

@WebSocketGateway({
	cors: {
		origin: '*',
	},
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	constructor(
		private readonly chatService: ChatService,
		private readonly onlineUserService: OnlineUserService,
	) {}

	handleConnection(client: Socket) {
        const userId = Number(
            client.handshake.query.userId,
        );

        if (!userId) {
            client.disconnect();
            return;
        }

        this.onlineUserService.addUser(
            userId,
            client.id,
        );

        client.join(`user:${userId}`);

        this.server.emit(
            CHAT_EVENTS.ONLINE_USERS,
            this.onlineUserService.getOnlineUsers(),
        );
    }

	// handleDisconnect(client: SocketUser) {
	// 	this.onlineUserService.removeUser(client.id);

	// 	this.server.emit(CHAT_EVENTS.ONLINE_USERS, this.onlineUserService.getOnlineUsers());
        
	// 	console.log('User Disconnected:', client.id);
	// }

    handleDisconnect(client: Socket) {
        this.onlineUserService.removeUser(
            client.id,
        );

        this.server.emit(
            CHAT_EVENTS.ONLINE_USERS,
            this.onlineUserService.getOnlineUsers(),
        );
    }

	@SubscribeMessage(CHAT_EVENTS.JOIN)
    async joinChat(
        @MessageBody() dto: JoinUserDto,
        @ConnectedSocket() client: SocketUser,
    ) {
        client.join(`user:${dto.id}`);

        return {
            success: true,
        };
    }

	@SubscribeMessage(CHAT_EVENTS.SEND_MESSAGE)
	async sendMessage(
		@MessageBody() dto: SendMessageDto,
	) {
		const message = await this.chatService.sendMessage(dto);

		this.server
			.to(`conversation:${dto.conversationId}`)
			.emit(CHAT_EVENTS.RECEIVE_MESSAGE, message);

		try {
			const participants = await this.chatService.getConversationParticipants(dto.conversationId);
			for (const p of participants) {
				this.server
					.to(`user:${p.userId}`)
					.emit(CHAT_EVENTS.RECEIVE_MESSAGE, message);
			}
		} catch (err) {
			console.error('Failed to broadcast message to user rooms:', err);
		}

		return message;
	}

	@SubscribeMessage(CHAT_EVENTS.UPDATE_MESSAGE)
	async updateMessage(
		@MessageBody()
		dto: UpdateMessageDto,
	) {
		const updatedMessage = await this.chatService.updateMessage(dto);

		this.server
			.to(`conversation:${updatedMessage.conversationId}`)
			.emit(CHAT_EVENTS.MESSAGE_UPDATED, updatedMessage);

		return updatedMessage;
	}

	@SubscribeMessage(CHAT_EVENTS.DELETE_MESSAGE)
	async deleteMessage(@MessageBody() data: {
			messageId: number;
			userId: number;
		},
	) {
		const deleted = await this.chatService.deleteMessage(
			data.messageId,
			data.userId,
		);

		this.server.emit(CHAT_EVENTS.MESSAGE_DELETED, {
            messageId: data.messageId,
        });

		return deleted;
	}

	@SubscribeMessage(CHAT_EVENTS.MARK_READ)
	async markAsRead(@MessageBody() data: {
        messageId: number;
        userId: number;
    }) {
		const read = await this.chatService.markAsRead(data.messageId, data.userId);

		if (read && read.conversationId) {
			this.server
				.to(`conversation:${read.conversationId}`)
				.emit(CHAT_EVENTS.MESSAGE_READ, read);
		} else {
			this.server.emit(
				CHAT_EVENTS.MESSAGE_READ,
				read,
			);
		}

		return read;
	}

	@SubscribeMessage('join-conversation')
	async joinConversation(@MessageBody() data: {
            conversationId: number;
        },
		@ConnectedSocket() client: SocketUser,
	) {
		client.join(`conversation:${data.conversationId}`);
		return {
			success: true,
		};
	}

	@SubscribeMessage(CHAT_EVENTS.TYPING)
	async typing(@MessageBody() data: {
        conversationId: number;
        userId: number;
    }) {
        if (await this.chatService.isBlocked(data.userId, data.conversationId)) {
            throw new ForbiddenException('You are blocked from this conversation');
        }
		this.server
			.to(`conversation:${data.conversationId}`)
			.emit(CHAT_EVENTS.TYPING, data);
	}
}
