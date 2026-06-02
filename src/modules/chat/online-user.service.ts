import { Injectable } from '@nestjs/common';

@Injectable()
export class OnlineUserService {
	private userSockets = new Map<number, Set<string>>();
	private socketUsers = new Map<string, number>();

	addUser(userId: number, socketId: string) {
		if (!this.userSockets.has(userId)) {
			this.userSockets.set(userId, new Set());
		}

		this.userSockets.get(userId)!.add(socketId);

		this.socketUsers.set(socketId, userId);
	}

	removeUser(socketId: string) {
		const userId = this.socketUsers.get(socketId);

		if (!userId) return;

		const sockets = this.userSockets.get(userId);

		sockets?.delete(socketId);

		if (sockets?.size === 0) {
			this.userSockets.delete(userId);
		}

		this.socketUsers.delete(socketId);
	}

	getSockets(userId: number): string[] {
		return Array.from(this.userSockets.get(userId) ?? []);
	}

	getUserId(socketId: string): number | undefined {
		return this.socketUsers.get(socketId);
	}

	isOnline(userId: number): boolean {
		return (
			this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0
		);
	}

	getOnlineUsers(): number[] {
		return [...this.userSockets.keys()];
	}
}
