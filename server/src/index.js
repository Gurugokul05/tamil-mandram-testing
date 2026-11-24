import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';

const start = async () => {
  try {
    await connectDatabase();

    const app = createApp();
    const server = app.listen(env.port, () => {
      console.log(`[api] listening on http://localhost:${env.port} (${env.nodeEnv})`);
    });

    const shutdown = async (signal) => {
      console.log(`[api] ${signal} received, shutting down`);
      server.close(async () => {
        const { disconnectDatabase } = await import('./config/db.js');
        await disconnectDatabase();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('[api] failed to start:', error.message);
    process.exit(1);
  }
};

start();
