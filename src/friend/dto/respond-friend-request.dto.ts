import { IsEnum } from 'class-validator';

export enum FriendRequestAction {
    ACCEPTED = "ACCEPTED",
    CANCELLED = 'CANCELLED',
}

export class RespondFriendRequestDto {
    @IsEnum(FriendRequestAction)
    action: FriendRequestAction;
}