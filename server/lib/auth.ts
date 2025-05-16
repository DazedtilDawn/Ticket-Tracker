import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { IStorage } from '../storage';

// JWT Secret from environment variable or default (only for development)
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_CHANGE_THIS_IN_PRODUCTION';

// Token expiration time (24 hours)
const TOKEN_EXPIRATION = '24h';

interface JwtPayload {
  id: number;
  username: string;
  role: string;
}

// Create JWT token
export function createJwt(user: { id: number; username: string; role: string }): string {
  const payload: JwtPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
}

// Verify JWT token
export function verifyJwt(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

// Authentication middleware
export function AuthMiddleware(storage: IStorage, requiredRole?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) // Remove 'Bearer ' prefix
      : null;
    
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Verify token
    const payload = verifyJwt(token);
    if (!payload) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    
    // Get user from database
    const user = await storage.getUser(payload.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Check role if required
    if (requiredRole && user.role !== requiredRole) {
      return res.status(403).json({ message: `${requiredRole} role required` });
    }
    
    // Attach user to request
    req.user = user;
    
    next();
  };
}

// Type definition for Express Request with user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
