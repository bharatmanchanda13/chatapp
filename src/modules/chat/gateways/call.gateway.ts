import {
	ConnectedSocket,
	MessageBody,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { OnlineUserService } from '../online-user.service';
import type { SocketUser } from '../interfaces/socket-user.interface';
import { CALL_EVENTS } from '../events';

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
	) {}

	private getSenderId(client: SocketUser): number | null {
		if (client.user?.id) return client.user.id;
		const onlineUsers = this.onlineUserService.getOnlineUsers();
		for (const userId of onlineUsers) {
			if (this.onlineUserService.getSocketId(userId) === client.id) {
				return userId;
			}
		}
		return null;
	}

	@SubscribeMessage(CALL_EVENTS.CALL_USER)
	async handleCallUser(
		@MessageBody()
		data: {
			to: number;
			offer: any;
			callerName?: string;
			type?: 'audio' | 'video';
		},
		@ConnectedSocket() client: SocketUser,
	) {
		const senderId = this.getSenderId(client);
		if (!senderId) return { success: false, error: 'Caller not identified' };

		const targetSocketId = this.onlineUserService.getSocketId(data.to);
		if (!targetSocketId) {
			return { success: false, error: 'User is offline' };
		}

		this.server.to(targetSocketId).emit(CALL_EVENTS.CALL_MADE, {
			offer: data.offer,
			from: senderId,
			callerName: data.callerName || 'Someone',
			type: data.type || 'audio',
		});

		return { success: true };
	}

	@SubscribeMessage(CALL_EVENTS.ANSWER_CALL)
	async handleAnswerCall(
		@MessageBody()
		data: {
			to: number;
			answer: any;
		},
		@ConnectedSocket() client: SocketUser,
	) {
		const senderId = this.getSenderId(client);
		if (!senderId) return { success: false, error: 'Receiver not identified' };

		const targetSocketId = this.onlineUserService.getSocketId(data.to);
		if (!targetSocketId) {
			return { success: false, error: 'User is offline' };
		}

		this.server.to(targetSocketId).emit(CALL_EVENTS.CALL_ANSWERED, {
			answer: data.answer,
			from: senderId,
		});

		return { success: true };
	}

	@SubscribeMessage(CALL_EVENTS.ICE_CANDIDATE)
	async handleIceCandidate(
		@MessageBody()
		data: {
			to: number;
			candidate: any;
		},
		@ConnectedSocket() client: SocketUser,
	) {
		const senderId = this.getSenderId(client);
		if (!senderId) return { success: false, error: 'Sender not identified' };

		const targetSocketId = this.onlineUserService.getSocketId(data.to);
		if (!targetSocketId) {
			return { success: false, error: 'User is offline' };
		}

		this.server.to(targetSocketId).emit(CALL_EVENTS.ICE_CANDIDATE_RECEIVED, {
			candidate: data.candidate,
			from: senderId,
		});

		return { success: true };
	}

	@SubscribeMessage(CALL_EVENTS.END_CALL)
	async handleEndCall(
		@MessageBody()
		data: {
			to: number;
		},
		@ConnectedSocket() client: SocketUser,
	) {
		const senderId = this.getSenderId(client);
		if (!senderId) return { success: false, error: 'Sender not identified' };

		const targetSocketId = this.onlineUserService.getSocketId(data.to);
		if (targetSocketId) {
			this.server.to(targetSocketId).emit(CALL_EVENTS.CALL_ENDED, {
				from: senderId,
			});
		}

		return { success: true };
	}

	@SubscribeMessage(CALL_EVENTS.REJECT_CALL)
	async handleRejectCall(
		@MessageBody()
		data: {
			to: number;
		},
		@ConnectedSocket() client: SocketUser,
	) {
		const senderId = this.getSenderId(client);
		if (!senderId) return { success: false, error: 'Sender not identified' };

		const targetSocketId = this.onlineUserService.getSocketId(data.to);
		if (targetSocketId) {
			this.server.to(targetSocketId).emit(CALL_EVENTS.CALL_REJECTED, {
				from: senderId,
			});
		}

		return { success: true };
	}

	@SubscribeMessage(CALL_EVENTS.CANCEL_CALL)
	async handleCancelCall(
		@MessageBody()
		data: {
			to: number;
		},
		@ConnectedSocket() client: SocketUser,
	) {
		const senderId = this.getSenderId(client);
		if (!senderId) return { success: false, error: 'Sender not identified' };

		const targetSocketId = this.onlineUserService.getSocketId(data.to);
		if (targetSocketId) {
			this.server.to(targetSocketId).emit(CALL_EVENTS.CALL_CANCELLED, {
				from: senderId,
			});
		}

		return { success: true };
	}
}
