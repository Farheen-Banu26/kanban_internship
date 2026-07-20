import { io } from 'socket.io-client';

export const createSocketClient = (token, socketUrl) => {
  if (!token) {
    throw new Error('Socket authentication token is required');
  }

  return io(socketUrl, {
    auth: {
      token: `Bearer ${token}`,
    },
    transports: ['websocket'],
    reconnectionAttempts: 5,
  });
};
