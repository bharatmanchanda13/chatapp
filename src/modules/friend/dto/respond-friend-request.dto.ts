import { FriendRequestStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export enum FriendRequestResponse {
  ACCEPTED = 'ACCEPTED',
  CANCELLED = 'CANCELLED'
}

export class RespondFriendRequestDto {
    @IsEnum(FriendRequestResponse)
    action: FriendRequestStatus | 'CANCELLED';
}