import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { env } from '../config/env.js';

let io;

const buildCorsOrigins = () => {
  return [env.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173']
    .filter(Boolean)
    .map((origin) => origin.replace(/\/$/, ''));
};

const getHandshakeToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  const queryToken = socket.handshake.query?.token;
  return authToken || queryToken;
};

export const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: buildCorsOrigins(),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = getHandshakeToken(socket);
    if (!token) {
      return next(new Error('Authentication token is required for socket connection'));
    }

    try {
      const strippedToken = token.replace(/^Bearer\s+/i, '');
      const decoded = jwt.verify(strippedToken, env.jwtSecret);
      socket.data.user = decoded;
      return next();
    } catch (error) {
      return next(new Error('Invalid socket authentication token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('joinWorkspace', (workspaceId) => {
      if (workspaceId) {
        socket.join(workspaceId.toString());
      }
    });

    socket.on('leaveWorkspace', (workspaceId) => {
      if (workspaceId) {
        socket.leave(workspaceId.toString());
      }
    });

    socket.on('disconnect', () => {
      // Socket disconnected; presence tracking may be added here.
    });
  });

  return io;
};

export const broadcastWorkspaceEvent = (workspaceId, event, payload) => {
  if (!io || !workspaceId) return;
  io.to(workspaceId.toString()).emit(event, payload);
};
