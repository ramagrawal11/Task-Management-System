import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || 60);

class Cache {
  private client: RedisClientType | null = null;
  private isConnected = false;

  private async ensureConnection(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Redis connection failed after 10 retries');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        this.isConnected = false;
      });

      await this.client.connect();
      this.isConnected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      await this.ensureConnection();
      if (!this.client) {
        return null;
      }

      const value = await this.client.get(key);
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<void> {
    try {
      await this.ensureConnection();
      if (!this.client) {
        return;
      }

      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttlSeconds, serialized);
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.ensureConnection();
      if (!this.client) {
        return;
      }

      await this.client.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.ensureConnection();
      if (!this.client) {
        return;
      }

      await this.client.flushDb();
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

const cache = new Cache();

process.on('SIGINT', async () => {
  await cache.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await cache.disconnect();
  process.exit(0);
});

export default cache;

