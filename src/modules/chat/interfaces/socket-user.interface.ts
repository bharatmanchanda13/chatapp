import { Socket } from 'socket.io';

export interface SocketUser
  extends Socket
{
  user?: {
    id: number;
  };
}