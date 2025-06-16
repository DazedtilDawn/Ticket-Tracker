import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { IStorage } from "../storage";

// JWT Secret from environment variable or default (only for development)
const JWT_SECRET =
  process.env.JWT_SECRET || "dev_jwt_secret_CHANGE_THIS_IN_PRODUCTION";

// Refresh token secret (different from access token secret)
const REFRESH_SECRET = 
  process.env.REFRESH_SECRET || JWT_SECRET + "_refresh";

// Token expiration times
const ACCESS_TOKEN_EXPIRATION = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRATION = "14d"; // 14 days
const REFRESH_TOKEN_REMEMBER_EXPIRATION = "28d"; // 28 days with "remember me"

interface JwtPayload {
  id: number;
  username: string;
  role: string;
}

// Create access token (short-lived)
export function createAccessToken(user: {
  id: number;
  username: string;
  role: string;
}): string {
  const payload: JwtPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
}

// Create refresh token (long-lived)
export function createRefreshToken(user: {
  id: number;
  username: string;
  role: string;
}, rememberMe: boolean = false): string {
  const payload: JwtPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  const expiration = rememberMe ? REFRESH_TOKEN_REMEMBER_EXPIRATION : REFRESH_TOKEN_EXPIRATION;
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: expiration });
}

// Backward compatibility alias
export const createJwt = createAccessToken;

// Verify access token
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

// Backward compatibility alias
export const verifyJwt = verifyAccessToken;

// Authentication middleware
export function AuthMiddleware(storage: IStorage, requiredRole?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
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

// Helper to set refresh token cookie
export function setRefreshTokenCookie(res: Response, token: string, rememberMe: boolean = false) {
  const maxAge = rememberMe ? 28 * 24 * 60 * 60 * 1000 : 14 * 24 * 60 * 60 * 1000; // 28 or 14 days in milliseconds
  
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge,
    path: '/',
  });
}

// Helper to clear refresh token cookie
export function clearRefreshTokenCookie(res: Response) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
}

// Type definition for Express Request with user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
