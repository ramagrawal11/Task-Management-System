import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient, RedisClientType } from 'redis';

// Redis client for rate limiting
let redisClient: RedisClientType | null = null;

// Initialize Redis client for rate limiting
async function getRedisClient(): Promise<RedisClientType | null> {
  if (!redisClient) {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      }) as RedisClientType;

      redisClient.on('error', (err) => {
        console.error('Redis Rate Limit Client Error:', err);
      });

      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
      return redisClient;
    } catch (error) {
      console.warn('Failed to connect Redis for rate limiting, will use memory store:', error);
      return null;
    }
  }
  return redisClient;
}

// Helper to create rate limit middleware with Redis store (optional)
async function createRateLimiterWithRedis(options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) {
  try {
    const client = await getRedisClient();
    if (client && client.isOpen) {
      return rateLimit({
        store: new RedisStore({
          sendCommand: (...args: string[]) => {
            return client.sendCommand(args);
          },
          prefix: 'rl:'
        }),
        windowMs: options.windowMs,
        max: options.max,
        message: options.message || 'Too many requests, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: options.skipSuccessfulRequests,
        skipFailedRequests: options.skipFailedRequests
      });
    }
  } catch (error) {
    console.warn('Redis not available for rate limiting, using memory store:', error);
  }
  
  // Fallback to memory store
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests,
    skipFailedRequests: options.skipFailedRequests
  });
}

// Initialize Redis connection (optional - falls back to memory if Redis unavailable)
void getRedisClient().catch(() => {
  // Silent fail - will use memory store
});

// General API rate limiter (100 requests per 15 minutes)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiter for authentication (5 requests per 15 minutes)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
});

// File upload rate limiter (10 uploads per hour)
export const fileUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many file uploads, please try again after 1 hour.',
  standardHeaders: true,
  legacyHeaders: false
});

// Analytics rate limiter (30 requests per 15 minutes)
export const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: 'Too many analytics requests, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiter for task creation (20 requests per hour)
export const taskCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many task creation requests, please try again after 1 hour.',
  standardHeaders: true,
  legacyHeaders: false
});

// Export function to create Redis-based rate limiter (optional, for future use)
export { createRateLimiterWithRedis };

// Graceful shutdown
export async function closeRateLimitRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}

