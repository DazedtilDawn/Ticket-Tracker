import crypto from "crypto";
import { db } from "../db";
import { loginTokens, users } from "@shared/schema";
import { eq, and, isNull, gt, sql } from "drizzle-orm";
import jsonwebtoken from "jsonwebtoken";

// Constants
const MAGIC_TOKEN_TTL_MIN = 15; // 15 minutes
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-replace-in-production";
const MAGIC_TOKEN_SECRET = process.env.MAGIC_TOKEN_SECRET || "magic-token-secret-key-replace-in-production";

/**
 * Hashes a raw token using HMAC-SHA256
 */
function hashToken(rawToken: string): string {
  return crypto.createHmac("sha256", MAGIC_TOKEN_SECRET).update(rawToken).digest("hex");
}

/**
 * Create a fingerprint from IP and User Agent to detect device changes
 */
function createFingerprint(ip: string, userAgent: string): string {
  return crypto.createHash("sha256").update(`${ip}${userAgent.slice(0, 80)}`).digest("hex");
}

/**
 * Create a JWT token for authenticated sessions
 */
export function createJwt(payload: { userId: number; role: string }): string {
  return jsonwebtoken.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

/**
 * Request a magic link login
 * Generates a token, stores it in the database, and returns a magic link
 */
export async function requestLogin(email: string, ip: string, userAgent: string) {
  // Find user by email (note: this assumes email is stored in username field)
  // In a production app, you would typically have a separate email field
  const userResults = await db.select().from(users).where(eq(users.username, email)).limit(1);
  const user = userResults[0];
  
  if (!user) {
    // In a real application, consider not revealing if a user exists or not
    // to prevent user enumeration attacks
    throw new Error("User not found");
  }
  
  // Generate a random token
  const rawToken = crypto.randomBytes(48).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + MAGIC_TOKEN_TTL_MIN * 60_000);
  const ipFingerprint = createFingerprint(ip, userAgent);
  
  // Store the token in the database
  await db.insert(loginTokens).values({
    tokenHash,
    userId: user.id,
    expiresAt,
    ipFingerprint
  });
  
  // Construct magic link
  const baseUrl = process.env.APP_URL || "http://localhost:5173";
  const magicLink = `${baseUrl}/login-consume?token=${rawToken}`;
  
  // In development, log the link to the console
  if (process.env.NODE_ENV === "development") {
    console.log(`🔑 Magic link for ${email}: ${magicLink}`);
  } else {
    // In production, you would send an email
    console.log(`Email would be sent to ${email} with link: ${magicLink}`);
    // TODO: Implement email sending
  }
  
  return { success: true };
}

/**
 * Consume a magic link token
 * Verifies the token, marks it as consumed, and returns user data with JWT
 */
export async function consumeLogin(rawToken: string, ip: string, userAgent: string) {
  const tokenHash = hashToken(rawToken);
  
  // Find the token in the database
  const tokenResult = await db.select()
    .from(loginTokens)
    .where(and(
      eq(loginTokens.tokenHash, tokenHash),
      isNull(loginTokens.consumedAt),
      gt(loginTokens.expiresAt, sql`now()`)
    ))
    .limit(1);
  
  const token = tokenResult[0];
  if (!token) {
    throw new Error("Invalid or expired login link");
  }
  
  // Optionally verify IP fingerprint for additional security
  const ipFingerprint = createFingerprint(ip, userAgent);
  if (token.ipFingerprint && token.ipFingerprint !== ipFingerprint) {
    console.warn(`IP/UA mismatch for token ${tokenHash.substring(0, 8)}...`);
    // Consider whether to fail or just log a warning
    // throw new Error("Security validation failed");
  }
  
  // Mark the token as consumed (one-time use)
  await db.update(loginTokens)
    .set({ consumedAt: sql`now()` })
    .where(eq(loginTokens.tokenHash, tokenHash));
  
  // Get the user
  const userResult = await db.select().from(users).where(eq(users.id, token.userId)).limit(1);
  const user = userResult[0];
  if (!user) {
    throw new Error("User not found");
  }
  
  // Create a JWT token for the session
  const jwt = createJwt({ userId: user.id, role: user.role });
  
  // Return user data (excluding password) and JWT
  const { password, ...userData } = user;
  return {
    jwt,
    user: userData
  };
}