import { Injectable } from '@nestjs/common';

@Injectable()
export class OnlineUserService {
	private users = new Map<number, string>();

	addUser(
		userId: number,
		socketId: string,
	) {
		this.users.set(userId, socketId);
	}

	removeUser(socketId: string) {
		for (const [
			userId,
			sockId,
		] of this.users.entries()) {
			if (sockId === socketId) {
				this.users.delete(userId);
				break;
			}
		}
	}

	getSocketId(userId: number) {
		return this.users.get(userId);
	}

	getOnlineUsers() {
		return [...this.users.keys()];
	}
}