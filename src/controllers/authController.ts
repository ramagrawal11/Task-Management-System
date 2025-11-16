import { Request, RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { userRepository } from '../repositories/userRepository';
import cache from '../cache';
import { UserModel } from '../models/userModel';

dotenv.config();

const SALT_ROUNDS = 10;

function ensureJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return secret;
}

export const register: RequestHandler = async (req, res) => {
  const { email, password, fullName } = req.body as {
    email: string;
    password: string;
    fullName: string;
  };

  try {
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      res.status(409).json({ message: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await userRepository.create({
      email,
      passwordHash,
      fullName
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to register user', detail });
  }
};

export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };

  try {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (!user.active) {
      res.status(403).json({ message: 'Account is inactive' });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    let token: string;

    try {
      token = jwt.sign(
        { id: user.id, email, fullName: user.fullName },
        ensureJwtSecret(),
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
      );
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: 'Failed to generate token', detail });
      return;
    }

    res.json({
      token,
      user: user.toJSON()
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to login', detail });
  }
};

export const getUser: RequestHandler = async (req, res) => {
  const userId = (req as Request & { userId: number }).userId;

  try {
    const cachedUser = await cache.get<ReturnType<UserModel['toJSON']>>(`user:${userId}`);

    if (cachedUser) {
      res.json(cachedUser);
      return;
    }

    const userProfile = await userRepository.findProfileById(userId);

    if (!userProfile) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!userProfile.active) {
      res.status(403).json({ message: 'Account is inactive' });
      return;
    }

    const profile = userProfile.toJSON();

    await cache.set(`user:${userId}`, profile);

    res.json(profile);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to fetch profile', detail });
  }
};


