import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';

import { Server } from 'socket.io';
import { ChatService } from '../chat.service';
import { OnlineUserService } from '../online-user.service';
import { CHAT_EVENTS } from '../events';
import { SendMessageDto } from '../dto/send-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import type { SocketUser } from '../interfaces/socket-user.interface';
import { JoinUserDto } from '../dto/join-user.dto';

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

	handleConnection(client: SocketUser) {
		console.log('User Connected:', client.id);
	}

	handleDisconnect(client: SocketUser) {
		this.onlineUserService.removeUser(client.id);

		this.server.emit(CHAT_EVENTS.ONLINE_USERS, this.onlineUserService.getOnlineUsers());
        
		console.log('User Disconnected:', client.id);
	}

	@SubscribeMessage(CHAT_EVENTS.JOIN)
	async joinChat(
        @MessageBody() dto: JoinUserDto,
	    @ConnectedSocket() client: SocketUser
    ) {
		const room = `user:${dto.id}`;

		client.join(room);

        console.log(dto.id, client.id,"::dto")
		this.onlineUserService.addUser(dto.id, client.id);

		this.server.emit(CHAT_EVENTS.ONLINE_USERS, this.onlineUserService.getOnlineUsers());

		return {
			success: true,
		};
	}

	/*
	==========================================
	SEND MESSAGE
	==========================================
	*/

	@SubscribeMessage(CHAT_EVENTS.SEND_MESSAGE)
	async sendMessage(
		@MessageBody() dto: SendMessageDto,
	) {
		const message = await this.chatService.sendMessage(dto);

		this.server
			.to(`conversation:${dto.conversationId}`)
			.emit(CHAT_EVENTS.RECEIVE_MESSAGE, message);

		return message;
	}

	/*
	==========================================
	UPDATE MESSAGE
	==========================================
	*/

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

	/*
	==========================================
	DELETE MESSAGE
	==========================================
	*/

	@SubscribeMessage(CHAT_EVENTS.DELETE_MESSAGE)
	async deleteMessage(
		@MessageBody()
		data: {
			messageId: number;

			userId: number;
		},
	) {
		const deleted = await this.chatService.deleteMessage(
			data.messageId,
			data.userId,
		);

		this.server.emit(
			CHAT_EVENTS.MESSAGE_DELETED,

			{
				messageId: data.messageId,
			},
		);

		return deleted;
	}

	/*
	==========================================
	MARK MESSAGE AS READ
	==========================================
	*/

	@SubscribeMessage(CHAT_EVENTS.MARK_READ)
	async markAsRead(
		@MessageBody()
		data: {
			messageId: number;

			userId: number;
		},
	) {
		const read = await this.chatService.markAsRead(data.messageId, data.userId);

		this.server.emit(
			CHAT_EVENTS.MESSAGE_READ,

			read,
		);

		return read;
	}

	/*
	==========================================
	JOIN CONVERSATION ROOM
	==========================================
	*/

	@SubscribeMessage('join-conversation')
	async joinConversation(
		@MessageBody()
		data: {
			conversationId: number;
		},

		@ConnectedSocket()
		client: SocketUser,
	) {
		client.join(`conversation:${data.conversationId}`);

		return {
			success: true,
		};
	}

	/*
	==========================================
	TYPING INDICATOR
	==========================================
	*/

	@SubscribeMessage(CHAT_EVENTS.TYPING)
	async typing(
		@MessageBody()
		data: {
			conversationId: number;

			userId: number;
		},
	) {
		this.server
			.to(`conversation:${data.conversationId}`)
			.emit(CHAT_EVENTS.TYPING, data);
	}
}
