import http from 'http';
import app from './app';
import { initializeDatabase } from './db';

const PORT = Number(process.env.PORT) || 3000;

async function start(): Promise<void> {
  try {
    await initializeDatabase();
    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

void start();

