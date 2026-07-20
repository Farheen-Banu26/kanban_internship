import { createServer } from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initSocketServer } from './utils/socketServer.js';

const start = async () => {
  await connectDB();

  const server = createServer(app);
  initSocketServer(server);

  server.listen(env.port, () => {
    console.log(`Server running on port ${env.port} [${env.nodeEnv}]`);
  });
};

start();
