import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

type JwtRequest = Request & { 
  user?: JwtPayload | string;
  userId?: number;
};

const authenticate: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing' });
  }

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({ message: 'JWT secret is not configured' });
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    (req as JwtRequest).user = decoded;
    
    // Extract userId from decoded token
    if (decoded && typeof decoded === 'object' && 'id' in decoded) {
      const id = decoded.id;
      if (typeof id === 'number') {
        (req as JwtRequest).userId = id;
      } else if (typeof id === 'string') {
        const parsed = Number(id);
        if (!Number.isNaN(parsed)) {
          (req as JwtRequest).userId = parsed;
        }
      }
    }
    
    // Ensure userId was successfully extracted
    if (!(req as JwtRequest).userId) {
      return res.status(401).json({ message: 'Invalid token: missing user ID' });
    }
    
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default authenticate;

