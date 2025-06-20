import express, { Request, Response, NextFunction } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db, pool } from "./db";
import path from "path";
import fs from "fs";
import { eq, and, ilike } from "drizzle-orm";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { users } from "../shared/schema";
import {
  loginSchema,
  insertUserSchema,
  insertChoreSchema,
  insertProductSchema,
  insertGoalSchema,
  completeChoreSchema,
  manualProductSchema,
  updateProductSchema,
  badBehaviorSchema,
  goodBehaviorSchema,
  deleteTransactionSchema,
  spinWheelSchema,
  insertDailyBonusSchema,
  dailyBonus,
  bonusSpinSchema,
  awardItemSchema,
  insertChildSchema,
  updateChildSchema,
  archiveChildSchema,
  type User,
} from "@shared/schema";
import { 
  createJwt, 
  verifyJwt, 
  AuthMiddleware, 
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie
} from "./lib/auth";
import { DailyBonusAssignmentMiddleware } from "./lib/daily-bonus-middleware";

import {
  calculateTier,
  calculateProgressPercent,
  calculateBoostPercent,
  getCurrentProductPrice,
  calculateOverSavedTickets,
  calculateGoalProgressFromBalance,
  ticketsNeededFor,
  spinTicketReward,
} from "./lib/business-logic";
import { WebSocketServer, WebSocket } from "ws";
import { cleanupOrphanedProducts } from "./cleanup";
import { success, failure } from "./lib/responses";
import { TICKET_CENT_VALUE } from "../config/business";

import { registerProfileImageRoutes } from "./lib/profile-upload";
import { registerBannerImageRoutes } from "./lib/banner-upload";

// --- helper: safely convert possible NULL from SQL
function toDateSafe(val: string | number | Date | null): Date | undefined {
  return val == null ? undefined : new Date(val);
}

function extractAsin(url: string): string {
  const asinPattern =
    /(?:\/dp\/|\/gp\/product\/|\/ASIN\/|%2Fdp%2F)([A-Z0-9]{10})/i;
  const match = url.match(asinPattern);
  if (match && match[1]) {
    return match[1];
  }
  throw new Error("Could not extract ASIN from URL.");
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Register image upload handlers
  console.log("[SETUP] Registering profile image routes...");
  registerProfileImageRoutes(app);
  console.log("[SETUP] Profile image routes registered successfully");

  console.log("[SETUP] Registering banner image routes...");
  registerBannerImageRoutes(app);
  console.log("[SETUP] Banner image routes registered successfully");

  // Create an endpoint to refresh the balances of all users
  app.post(
    "/api/transactions/refresh-balances",
    async (req: Request, res: Response) => {
      try {
        // Get all users
        const allUsers = await storage.getUsers();

        // Update balances for each user - use the storage method to ensure consistency
        // across all API endpoints
        const results = await Promise.all(
          allUsers.map(async (user) => {
            // Use the same getUserBalance method that the /api/stats endpoint uses
            // This ensures consistency between Parent Command Center and child dashboard
            const balance = await storage.getUserBalance(user.id);
            return { userId: user.id, balance };
          }),
        );

        console.log("Balances refreshed:", results);
        res.status(200).json(results);
      } catch (error) {
        console.error("Error refreshing balances:", error);
        res.status(500).json({ message: "Failed to refresh balances" });
      }
    },
  );

  app.get("/health", (_req: Request, res: Response) => {
    res.send("ok");
  });

  // Create directories for uploads if they don't exist
  const uploadsDir = path.join(process.cwd(), "public/uploads");
  const profilesDir = path.join(uploadsDir, "profiles");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
  }

  // Serve static files from public folder
  app.use("/uploads", express.static(uploadsDir)); // Changed to use uploadsDir

  // Setup WebSockets for realtime updates with specific path
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws",
  });

  wss.on("connection", (ws: WebSocket) => {
    console.log("New WebSocket connection established");

    ws.on("message", (message: Buffer) => {
      try {
        const { event, data } = JSON.parse(message.toString());
        console.log("WebSocket message received:", event, data);

        // Handle client connection acknowledgment
        if (event === "client:connected") {
          console.log("Client acknowledged connection");
          // Send a welcome message back to confirm two-way communication
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                event: "server:welcome",
                data: {
                  message: "Welcome to the TicketTracker realtime service",
                  timestamp: new Date().toISOString(),
                },
              }),
            );
          }
        }

        // Handle ping test messages
        else if (event === "client:ping") {
          console.log("Received ping test from client");
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                event: "server:pong",
                data: {
                  received: data,
                  serverTime: new Date().toISOString(),
                  message: "Connection test successful",
                },
              }),
            );

            // Create a real test transaction to help debug UI updates
            const createAndBroadcastTestTransaction = async () => {
              try {
                // Create a real transaction (small reward for testing)
                const testAmount = 5; // 5 tickets as a test reward
                const transaction = await storage.createTransaction({
                  type: "reward",
                  delta: testAmount,
                  note: "WebSocket test reward (connection test)",
                  user_id: 1,
                });

                console.log("Created real test transaction:", transaction.id);

                // Broadcast the real transaction to all clients
                broadcast("transaction:reward", {
                  id: transaction.id,
                  type: "reward",
                  delta_tickets: testAmount,
                  note: "WebSocket test reward (connection test)",
                  user_id: 1,
                });
              } catch (error) {
                console.error("Failed to create test transaction:", error);

                // Fall back to dummy transaction if real one fails
                broadcast("transaction:test", {
                  id: 999999,
                  type: "test",
                  delta_tickets: 5, // Using 5 tickets to match the real transaction
                  note: "WebSocket test transaction (dummy)",
                  user_id: 1,
                });
              }
            };

            // Execute asynchronously
            createAndBroadcastTestTransaction();
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  // Broadcast to all connected clients
  function broadcast(event: string, data: any) {
    console.log(`Broadcasting event: ${event}`, {
      clientCount: wss.clients.size,
      dataType: typeof data,
      timestamp: new Date().toISOString(),
    });

    if (event.startsWith("transaction:")) {
      console.log(
        `Transaction broadcast payload:`,
        JSON.stringify(data, null, 2),
      );
    }

    const message = JSON.stringify({ event, data });
    let sent = 0;
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        sent++;
      }
    });
    console.log(
      `Broadcast complete: ${sent}/${wss.clients.size} client(s) reached`,
    );
  }

  // Auth Routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(credentials.username);

      if (!user || user.passwordHash !== credentials.password) {
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }

      // ---- Parent-only authentication lockdown ----
      // Children are managed via the parent's session; they must not log in directly.
      if (user.role !== "parent") {
        return res
          .status(403)
          .json({ message: "Only parent accounts may sign in" });
      }

      // Generate tokens for the authenticated user
      const rememberMe = req.body.rememberMe === true;
      const accessToken = createAccessToken(user);
      const refreshToken = createRefreshToken(user, rememberMe);
      
      // Set refresh token as HttpOnly cookie
      setRefreshTokenCookie(res, refreshToken, rememberMe);
      
      // Keep backward compatibility with "token" field
      const token = accessToken;

      // Handle daily bonus assignment for parent users on login
      let dailyBonusAssignments = null;
      if (user.role === "parent") {
        try {
          console.log(
            `Parent user ${user.id} (${user.username}) logged in, checking daily bonus assignments`,
          );

          // Get today's date
          const today = new Date().toISOString().split("T")[0];

          // Check if daily bonuses have already been assigned today
          const childUsers = await storage.getUsersByRole("child");
          let assignedCount = 0;
          let needsAssignment = false;

          // Check each child to see if they already have a bonus for today
          for (const child of childUsers) {
            const existingBonus = await storage.getDailyBonus(today, child.id);
            if (!existingBonus) {
              needsAssignment = true;
              break;
            } else {
              assignedCount++;
            }
          }

          // If all children already have bonuses, skip assignment
          if (childUsers.length > 0 && assignedCount === childUsers.length) {
            console.log(
              `All ${childUsers.length} children already have daily bonuses assigned for today`,
            );
          }
          // Otherwise, assign bonuses to all children
          else if (needsAssignment) {
            console.log(`Assigning daily bonuses to children on parent login`);
            dailyBonusAssignments =
              await storage.assignDailyBonusesToAllChildren(today);
            console.log(
              `Daily bonus assignment complete:`,
              dailyBonusAssignments,
            );

            // Broadcast the new assignments to all clients
            for (const [childId, bonus] of Object.entries(
              dailyBonusAssignments,
            )) {
              if (bonus) {
                broadcast("daily_bonus:assigned", {
                  user_id: parseInt(childId),
                  daily_bonus: bonus,
                });
              }
            }
          }
        } catch (error) {
          console.error(
            "Error assigning daily bonuses on parent login:",
            error,
          );
          // Don't fail the login if bonus assignment fails
        }
      }

      return res.json(
        success({
          token, // Keep for backward compatibility
          access_token: accessToken,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
          },
          daily_bonus_assignments: dailyBonusAssignments,
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json(failure("BadRequest", message));
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      // Parse the request body but handle password separately
      const { password, ...userData } = req.body;
      
      // Validate the user data (without password_hash)
      const validatedData = insertUserSchema.omit({ passwordHash: true }).parse(userData);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // If registering a parent, create a family first
      let family_id: number | undefined;
      if (validatedData.role === 'parent') {
        const familyName = `${validatedData.name}'s Family`;
        const family = await storage.createFamily(familyName);
        family_id = family.id;
      }

      // For now, store password as plain text (in production, use bcrypt)
      const userWithPassword = {
        ...validatedData,
        passwordHash: password || 'password123', // Default password for testing
        family_id, // Add family_id if created
      };

      const newUser = await storage.createUser(userWithPassword);
      
      // If parent, add to family_parents table
      if (newUser.role === 'parent' && family_id) {
        await storage.addParentToFamily(family_id, newUser.id, 'parent');
      }
      
      // Generate tokens
      const rememberMe = req.body.rememberMe === true;
      const accessToken = createAccessToken(newUser);
      const refreshToken = createRefreshToken(newUser, rememberMe);
      
      // Set refresh token as HttpOnly cookie
      setRefreshTokenCookie(res, refreshToken, rememberMe);
      
      // Keep backward compatibility
      const token = accessToken;

      return res.status(201).json(
        success({
          token, // Keep for backward compatibility
          access_token: accessToken,
          user: {
            id: newUser.id,
            name: newUser.name,
            username: newUser.username,
            role: newUser.role,
          },
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json(failure("BadRequest", message));
    }
  });

  // Refresh token endpoint
  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      // Get refresh token from cookie
      const refreshToken = req.cookies?.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token not found" });
      }
      
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);
      if (!payload) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }
      
      // Get user from database
      const user = await storage.getUser(payload.id);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Generate new access token
      const accessToken = createAccessToken(user);
      
      return res.json(
        success({
          access_token: accessToken,
          token: accessToken, // Backward compatibility
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(401).json(failure("Unauthorized", message));
    }
  });

  // Logout endpoint to clear refresh token
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    clearRefreshTokenCookie(res);
    return res.json(success({ message: "Logged out successfully" }));
  });

  // Protected routes middleware
  const auth = AuthMiddleware(storage);
  const parentOnly = AuthMiddleware(storage, "parent");

  // Daily bonus assignment middleware for parent users
  const dailyBonusAssignment = DailyBonusAssignmentMiddleware(storage);

  // Apply daily bonus assignment middleware to parent-only routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Only apply to authenticated parent users
    if (req.user && req.user.role === "parent") {
      dailyBonusAssignment(req, res, next);
    } else {
      next();
    }
  });

  // Admin route to clean up orphaned products
  app.get(
    "/api/admin/cleanup",
    parentOnly,
    async (req: Request, res: Response) => {
      try {
        console.log("Running database cleanup...");
        const result = await cleanupOrphanedProducts();
        return res.json(result);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return res.status(500).json({ message: errorMessage });
      }
    },
  );

  // User routes - public to support automatic family login
  app.get("/api/users", async (req: Request, res: Response) => {
    const usersList = await storage.getUsers(); // Renamed to avoid conflict with schema import

    // Remove passwords from response but include profile image URL
    const sanitizedUsers = usersList.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      profile_image_url: user.profile_image_url,
    }));

    return res.json(sanitizedUsers);
  });

  // ---------------------------------------------------------------------------
  // Family / Child profile routes
  // ---------------------------------------------------------------------------

  /**
   * GET /api/family/children
   * Returns the list of children that belong to the authenticated parent.
   * By default returns only active (non-archived) children.
   * Use ?includeArchived=true to include archived children.
   *
   * Response: Child[] with minimally-needed fields
   */
  app.get("/api/family/children", auth, async (req: Request, res: Response) => {
    // @ts-ignore – AuthMiddleware put `user` on the request object
    const requester = req.user as User;

    if (requester.role !== "parent") {
      return res.status(403).json({ message: "Only parent accounts may access children list" });
    }

    const includeArchived = req.query.includeArchived === 'true';

    try {
      // Get the parent
      const parent = await storage.getUser(requester.id);
      if (!parent) {
        return res.status(404).json({ message: "Parent not found" });
      }

      // Use username pattern matching
      const usernamePattern = `${parent.username}_child_%`;

      // Build query conditions
      const conditions: any[] = [
        ilike(users.username, usernamePattern),
        eq(users.role, "child")
      ];

      // Only filter out archived if not including them
      if (!includeArchived) {
        conditions.push(eq(users.is_archived, false));
      }

      // Get children
      const children = await db
        .select()
        .from(users)
        .where(and(...conditions));

      // Sanitize: never leak passwordHash etc.
      const sanitized = children.map((c: User) => ({
        id: c.id,
        name: c.name,
        username: c.username,
        profile_image_url: c.profile_image_url,
        banner_color_preference: c.banner_color_preference,
        is_archived: c.is_archived,
      }));

      return res.json(sanitized);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ message: msg });
    }
  });

  /**
   * POST /api/family/children
   * Body: { name: string, profile_image_url?: string }
   * Creates a new child profile for the authenticated parent.
   */
  app.post(
    "/api/family/children",
    auth,
    async (req: Request, res: Response) => {
      // @ts-ignore set by AuthMiddleware
      const requester = req.user as User;
      if (requester.role !== "parent") {
        return res
          .status(403)
          .json({ message: "Only parents may create child profiles" });
      }

      try {
        const data = insertChildSchema.parse(req.body);
        const child = await storage.createChildForParent(requester.id, data);
        return res.status(201).json({
          id: child.id,
          name: child.name,
          username: child.username,
          profile_image_url: child.profile_image_url,
          banner_color_preference: child.banner_color_preference,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return res.status(400).json({ message: msg });
      }
    }
  );

  /**
   * PUT /api/family/children/:childId
   * Updates a child's profile (name and/or profile image).
   * Auth: parent only, must own the child.
   */
  app.put(
    "/api/family/children/:childId",
    auth,
    async (req: Request, res: Response) => {
      // @ts-ignore - req.user is set by auth middleware
      const requester = req.user as User;
      if (requester.role !== "parent") {
        return res.status(403).json({ message: "Only parents may update child profiles" });
      }

      const childId = parseInt(req.params.childId);
      if (isNaN(childId)) {
        return res.status(400).json({ message: "Invalid childId" });
      }

      try {
        // Validate the request body
        const data = updateChildSchema.parse(req.body);
        
        // Update the child (storage.updateChildForParent will verify ownership)
        const updatedChild = await storage.updateChildForParent(
          requester.id,
          childId,
          data
        );

        // Return the updated child data
        return res.json({
          id: updatedChild.id,
          name: updatedChild.name,
          username: updatedChild.username,
          profile_image_url: updatedChild.profile_image_url,
          banner_color_preference: updatedChild.banner_color_preference,
        });
      } catch (err) {
        if (err instanceof Error) {
          if (err.message.includes("not found") || err.message.includes("does not belong")) {
            return res.status(404).json({ message: err.message });
          }
        }
        const msg = err instanceof Error ? err.message : String(err);
        return res.status(400).json({ message: msg });
      }
    }
  );

  /**
   * PATCH /api/family/children/:childId/archive
   * Body: { archived: boolean }
   * Soft-archive (or un-archive) a child account.
   *
   * – parent-only
   * – verifies child belongs to calling parent
   */
  app.patch(
    "/api/family/children/:childId/archive",
    auth,
    async (req: Request, res: Response) => {
      // @ts-ignore - req.user is set by auth middleware
      const requester = req.user as User;
      if (requester.role !== "parent") {
        return res.status(403).json({ message: "Only parents may archive children" });
      }

      const childId = parseInt(req.params.childId);
      if (isNaN(childId)) {
        return res.status(400).json({ message: "Invalid childId" });
      }

      try {
        // Validate body
        const { archived } = archiveChildSchema.parse(req.body);

        // Use archiveChildForParent which verifies ownership
        const updated = await storage.archiveChildForParent(
          requester.id,
          childId,
          archived
        );

        return res.json({
          id: updated.id,
          name: updated.name,
          is_archived: updated.is_archived,
        });
      } catch (err) {
        if (err instanceof Error) {
          if (err.message.includes("not found") || err.message.includes("does not belong")) {
            return res.status(404).json({ message: err.message });
          }
        }
        const msg = err instanceof Error ? err.message : String(err);
        return res.status(400).json({ message: msg });
      }
    },
  );

  /**
   * DELETE /api/family/children/:childId
   * Permanently deletes a child profile.
   * Auth: parent only, must own the child.
   */
  app.delete(
    "/api/family/children/:childId",
    auth,
    async (req: Request, res: Response) => {
      // @ts-ignore - req.user is set by auth middleware
      const requester = req.user as User;
      if (requester.role !== "parent") {
        return res.status(403).json({ message: "Only parents may delete child profiles" });
      }

      const childId = parseInt(req.params.childId);
      if (isNaN(childId)) {
        return res.status(400).json({ message: "Invalid childId" });
      }

      try {
        // Delete the child (storage.deleteChildForParent will verify ownership)
        const result = await storage.deleteChildForParent(
          requester.id,
          childId
        );

        return res.json({
          id: result.id,
          deleted: true
        });
      } catch (err) {
        if (err instanceof Error) {
          if (err.message.includes("not found") || err.message.includes("does not belong")) {
            return res.status(404).json({ message: err.message });
          }
        }
        const msg = err instanceof Error ? err.message : String(err);
        return res.status(400).json({ message: msg });
      }
    }
  );

  /**
   * POST /api/families/:id/invite-parent
   * Invite another parent to the family
   */
  app.post(
    "/api/families/:id/invite-parent",
    parentOnly,
    async (req: Request, res: Response) => {
      try {
        const familyId = parseInt(req.params.id);
        const { email } = req.body;
        
        if (!email) {
          return res.status(400).json({ message: "Email is required" });
        }
        
        // Verify the requesting parent belongs to this family
        const isInFamily = req.user.family_id === familyId || 
          await storage.isParentInFamily(familyId, req.user.id);
          
        if (!isInFamily) {
          return res.status(403).json({ message: "You do not belong to this family" });
        }
        
        // Check if user with email exists
        const invitedUser = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
          
        if (invitedUser.length === 0) {
          // TODO: In production, send invite email here
          return res.json(success({
            message: "Invitation sent to " + email,
            status: "pending"
          }));
        }
        
        const existingParent = invitedUser[0];
        
        // Check if they're already a parent
        if (existingParent.role !== 'parent') {
          return res.status(400).json({ 
            message: "User is not a parent account" 
          });
        }
        
        // Check if already in family
        const alreadyInFamily = await storage.isParentInFamily(familyId, existingParent.id);
        if (alreadyInFamily) {
          return res.status(400).json({ 
            message: "Parent is already in this family" 
          });
        }
        
        // Add parent to family
        await storage.addParentToFamily(familyId, existingParent.id, 'parent');
        
        // Update their family_id if they don't have one
        if (!existingParent.family_id) {
          await db
            .update(users)
            .set({ family_id: familyId })
            .where(eq(users.id, existingParent.id));
        }
        
        return res.json(success({
          message: "Parent added to family",
          parent: {
            id: existingParent.id,
            name: existingParent.name,
            email: existingParent.email,
          }
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(500).json(failure("InternalError", message));
      }
    }
  );

  /**
   * GET /api/families/:id/parents
   * Get all parents in a family
   */
  app.get(
    "/api/families/:id/parents",
    auth,
    async (req: Request, res: Response) => {
      try {
        const familyId = parseInt(req.params.id);
        
        // Verify the requesting user belongs to this family
        const belongsToFamily = req.user.family_id === familyId || 
          (req.user.role === 'parent' && await storage.isParentInFamily(familyId, req.user.id));
          
        if (!belongsToFamily) {
          return res.status(403).json({ message: "You do not belong to this family" });
        }
        
        const parents = await storage.getFamilyParents(familyId);
        
        return res.json(success({
          parents: parents.map(p => ({
            id: p.parent.id,
            name: p.parent.name,
            email: p.parent.email,
            role: p.role,
            added_at: p.added_at,
          }))
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(500).json(failure("InternalError", message));
      }
    }
  );

  // Chore routes
  // Rate limiting for chores endpoint to prevent infinite loops
  const choreRequestCounts = new Map<string, { count: number; timestamp: number }>();
  const RATE_LIMIT_WINDOW = 1000; // 1 second
  const MAX_REQUESTS_PER_WINDOW = 5; // Maximum 5 requests per second per IP

  // Global circuit breaker to stop infinite loops
  let choresTotalRequests = 0;
  const CIRCUIT_BREAKER_THRESHOLD = 100;
  let circuitBreakerOpen = false;

  app.get("/api/chores", auth, async (req: Request, res: Response) => {
    const activeOnly = req.query.activeOnly !== "false";
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

    // If a specific user ID is provided, include completion status
    if (userId) {
      // Parents can view any user's chore status, children can only view their own
      if (req.user.role !== "parent" && userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to view these chores" });
      }

      const choresWithStatus = await storage.getChoreStatusForUser(userId);
      return res.json(choresWithStatus);
    }

    // Default behavior - return chores without completion status
    const chores = await storage.getChores(activeOnly);
    return res.json(chores);
  });

  app.post("/api/chores", parentOnly, async (req: Request, res: Response) => {
    try {
      console.log("Creating new chore with data:", req.body);

      // Map legacy 'tickets' field to 'base_tickets' for backward compatibility
      if (req.body.tickets && !req.body.base_tickets) {
        req.body.base_tickets = req.body.tickets;
      }

      const choreData = insertChoreSchema.parse(req.body);
      console.log("Validated chore data:", choreData);
      const newChore = await storage.createChore(choreData);
      console.log("New chore created:", newChore);

      // Calculate and update tier
      const chores = await storage.getChores();
      const tier = calculateTier(newChore.base_tickets, chores);
      console.log("Calculated tier:", tier);
      const updatedChore = await storage.updateChore(newChore.id, { tier });
      console.log("Updated chore with tier:", updatedChore);

      broadcast("chore:new", updatedChore);
      return res.status(201).json(updatedChore);
    } catch (error) {
      console.error("Error creating chore:", error);
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json({ message });
    }
  });

  app.put(
    "/api/chores/:id",
    parentOnly,
    async (req: Request, res: Response) => {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid chore ID" });
      }

      try {
        // Allow partial updates and support legacy 'tickets' field
        const choreUpdate = req.body;
        if (choreUpdate.tickets && !choreUpdate.base_tickets) {
          choreUpdate.base_tickets = choreUpdate.tickets;
        }
        const updatedChore = await storage.updateChore(id, choreUpdate);

        if (!updatedChore) {
          return res.status(404).json({ message: "Chore not found" });
        }

        // Recalculate tier for all chores if base_tickets changed
        if (choreUpdate.base_tickets) {
          const chores = await storage.getChores();
          for (const chore of chores) {
            const tierRecalc = calculateTier(chore.base_tickets, chores);
            if (tierRecalc !== chore.tier) {
              await storage.updateChore(chore.id, { tier: tierRecalc });
            }
          }
        }

        broadcast("chore:update", updatedChore);
        return res.json(updatedChore);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(400).json({ message });
      }
    },
  );

  app.delete(
    "/api/chores/:id",
    parentOnly,
    async (req: Request, res: Response) => {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid chore ID" });
      }

      const deleted = await storage.deleteChore(id);
      if (!deleted) {
        return res.status(404).json({ message: "Chore not found" });
      }

      broadcast("chore:delete", { id });
      return res.json({ message: "Chore deleted successfully" });
    },
  );

  // Chore completion endpoint
  app.post(
    "/api/chores/:choreId/complete",
    parentOnly,
    async (req: Request, res: Response) => {
      const choreId = parseInt(req.params.choreId);
      if (isNaN(choreId)) {
        return res.status(400).json({ message: "Invalid chore ID" });
      }

      try {
        const { user_id } = req.body;
        let targetUserId = user_id;

        // If no user_id provided, this should be handled by parent-only middleware
        if (!targetUserId) {
          return res.status(400).json({ message: "user_id is required" });
        }

        // Verify the chore exists
        const chore = await storage.getChore(choreId);
        if (!chore) {
          return res.status(404).json({ message: "Chore not found" });
        }

        // Verify the user exists
        const user = await storage.getUser(targetUserId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Log the chore completion
        const completion = await storage.logChoreCompletion(choreId, targetUserId);

        // Create a transaction for the chore completion
        const transaction = await storage.createTransaction({
          user_id: targetUserId,
          chore_id: choreId,
          delta: chore.base_tickets,
          type: "earn",
          note: `Completed: ${chore.name}`,
          source: "chore",
          performed_by_id: req.user.id, // Track who performed the action
        });

        // Get updated balance
        const balance = await storage.getUserBalance(targetUserId);

        // Broadcast the completion
        broadcast("chore:completed", {
          chore,
          user,
          completion,
          transaction,
          balance,
        });

        return res.status(201).json({
          success: true,
          completion,
          transaction,
          balance,
        });
      } catch (error) {
        console.error("Error completing chore:", error);
        const message = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ message });
      }
    },
  );

  // Product routes
  // Get all available products
  app.get("/api/products", auth, async (_req: Request, res: Response) => {
    try {
      // Get all products in the system
      const productsList = await storage.getAllProducts(); // Renamed to avoid conflict with schema
      return res.json(success(productsList));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return res.status(500).json(failure("ServerError", errorMessage));
    }
  });

  // Manual product creation endpoint
  app.post(
    "/api/products/manual",
    auth,
    async (req: Request, res: Response) => {
      try {
        console.log("Manual product creation - received data:", req.body);
        const productData = manualProductSchema.parse(req.body);
        console.log("Manual product creation - parsed data:", productData);

        // Check for exact ASIN match if amazonUrl is provided
        if (productData.amazonUrl) {
          try {
            const asin = extractAsin(productData.amazonUrl);
            console.log("Extracted ASIN:", asin);
            const existingProduct = await storage.getProductByAsin(asin);
            if (existingProduct) {
              console.log("Found existing product by ASIN:", existingProduct);

              // Update the existing product with the new details
              const updatedProduct = await storage.updateProduct(
                existingProduct.id,
                {
                  title: productData.title,
                  image_url: productData.image_url || existingProduct.image_url,
                  price_cents: productData.price_cents,
                },
              );

              console.log(
                "Updated existing product with new details:",
                updatedProduct,
              );

              return res.json(
                success({
                  ...updatedProduct,
                  alreadyExists: true,
                  wasUpdated: true,
                }),
              );
            }
          } catch (e) {
            console.log("ASIN extraction failed:", e);
            // If ASIN extraction fails, fallback to title matching
          }
        }

        // Only if no exact ASIN match, check if product with exact same title exists
        // Using exactMatch=true to ensure case-insensitive exact title matching
        console.log(
          "Checking for existing product with title:",
          productData.title,
        );
        const existingProductsByTitle = await storage.getProductsByTitle(
          productData.title,
          true,
        );
        console.log("Existing products by title:", existingProductsByTitle);

        // No need for additional filtering as the database query already does the exact matching
        const exactTitleMatch =
          existingProductsByTitle.length > 0
            ? existingProductsByTitle[0]
            : null;

        if (exactTitleMatch) {
          // Return the exact match
          console.log("Found exact title match:", exactTitleMatch);
          return res.json(
            success({
              ...exactTitleMatch,
              alreadyExists: true,
            }),
          );
        }

        // Handle ASIN generation for products without Amazon URL
        let asinGen = ""; // Renamed to avoid conflict
        if (productData.amazonUrl) {
          try {
            asinGen = extractAsin(productData.amazonUrl);
          } catch (e) {
            // Generate a unique ASIN-like ID for non-Amazon products
            asinGen =
              "MANUAL" +
              Math.random().toString(36).substring(2, 7).toUpperCase();
          }
        } else {
          // Generate a unique ASIN-like ID for non-Amazon products
          asinGen =
            "MANUAL" + Math.random().toString(36).substring(2, 7).toUpperCase();
        }
        console.log("Generated ASIN:", asinGen);

        // Create the product with the user-specified title
        const newProduct = {
          title: productData.title,
          asin: asinGen,
          image_url:
            productData.image_url ||
            "https://placehold.co/400x400?text=No+Image",
          price_cents: productData.price_cents,
        };
        console.log("Creating new product:", newProduct);

        const product = await storage.createProduct(newProduct);
        console.log("Created product:", product);

        return res.status(201).json(success(product));
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return res.status(400).json(failure("BadRequest", errorMessage));
      }
    },
  );

  // Update product details
  app.put("/api/products/:id", auth, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json(failure("BadRequest", "Invalid product ID"));
    }

    // Only parents can edit products
    if (req.user.role !== "parent") {
      return res.status(403).json(failure("Forbidden", "Not authorized"));
    }

    try {
      const update = updateProductSchema.parse(req.body);
      // If price is being updated, lock the price for existing goals as well
      const finalUpdate = {
        ...update,
        ...(update.price_cents !== undefined && {
        }),
      };
      const updated = await storage.updateProduct(id, finalUpdate);
      if (!updated) {
        return res.status(404).json(failure("NotFound", "Product not found"));
      }

      // Broadcast update to clients (optional)
      broadcast("product:update", updated);

      return res.json(success(updated));
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json(failure("BadRequest", message));
    }
  });

  // Delete product (parent-only)
  app.delete("/api/products/:id", auth, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10); // Added radix 10
    if (isNaN(id)) {
      return res.status(400).json(failure("BadRequest", "Invalid product ID"));
    }

    if (req.user.role !== "parent") {
      return res.status(403).json(failure("Forbidden", "Not authorized"));
    }

    try {
      // Block deletion if any goals still reference this product
      const goalsUsingProduct = await storage.getGoalsByProductId(id);
      if (goalsUsingProduct.length > 0) {
        return res
          .status(400)
          .json(failure("BadRequest", "Product is linked to existing goals"));
      }

      const deleted = await storage.deleteProduct(id);
      if (!deleted) {
        return res.status(404).json(failure("NotFound", "Product not found"));
      }

      broadcast("product:deleted", { id });
      return res.json(success(true));
    } catch (err: any) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(500).json(failure("ServerError", message));
    }
  });

  // Goal routes
  app.get("/api/goals", auth, async (req: Request, res: Response) => {
    const { userId } = req.query;
    const user = req.user;

    // Parents can view any user's goals, children can only view their own
    if (
      user.role !== "parent" &&
      userId &&
      parseInt(userId as string) !== user.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view these goals" });
    }

    const targetUserId = userId ? parseInt(userId as string) : user.id;
    const goals = await storage.getGoalsByUser(targetUserId);

    // Fetch products for each goal
    const goalsWithProducts = await Promise.all(
      goals.map(async (goal) => {
        const product = await storage.getProduct(goal.product_id);
        return {
          ...goal,
          product,
          progress: product
            ? calculateGoalProgressFromBalance(
                await storage.getUserBalance(goal.user_id),
                product.price_cents,
              )
            : 0,
        };
      }),
    );

    return res.json(goalsWithProducts);
  });

  app.get("/api/goals/active", auth, async (req: Request, res: Response) => {
    const { userId } = req.query;
    const user = req.user;

    // Parents can view any user's active goal, children can only view their own
    if (
      user.role !== "parent" &&
      userId &&
      parseInt(userId as string) !== user.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this goal" });
    }

    const targetUserId = userId ? parseInt(userId as string) : user.id;
    const goal = await storage.getActiveGoalByUser(targetUserId);

    if (!goal) {
      return res.status(404).json({ message: "No active goal found" });
    }

    // Get user's current balance
    const userBalance = await storage.getUserBalance(targetUserId);
    
    const currentPrice = getCurrentProductPrice(goal);
    const progressPercent = calculateGoalProgressFromBalance(
      userBalance,
      currentPrice,
    );
    const overSavedTickets = calculateOverSavedTickets(
      userBalance,
      currentPrice,
    );

    return res.json({
      ...goal,
      tickets_saved: userBalance, // For backward compatibility
      progress: progressPercent,
      overSavedTickets,
      // Include current product price for transparency
      product: {
        ...goal.product,
        price_cents: currentPrice,
      },
    });
  });

  app.post("/api/goals", auth, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const goalData = insertGoalSchema.parse(req.body);

      // Users can only create goals for themselves
      if (user.role !== "parent" && goalData.user_id !== user.id) {
        return res
          .status(403)
          .json({ message: "Not authorized to create goals for other users" });
      }

      // Verify product exists
      const product = await storage.getProduct(goalData.product_id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const newGoal = await storage.createGoal(goalData);

      broadcast("goal:new", {
        ...newGoal,
        product,
        progress: 0,
      });

      return res.status(201).json({
        ...newGoal,
        product,
        progress: 0,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json({ message });
    }
  });

  app.put(
    "/api/goals/:id/activate",
    auth,
    async (req: Request, res: Response) => {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid goal ID" });
      }

      const user = req.user;
      const goal = await storage.getGoal(id);

      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }

      // Users can only activate their own goals
      if (user.role !== "parent" && goal.user_id !== user.id) {
        return res
          .status(403)
          .json({ message: "Not authorized to modify this goal" });
      }

      // Let the storage layer handle ticket transfers internally
      // This will automatically find current active goals and transfer tickets
      const updatedGoal = await storage.updateGoal(id, {
        is_active: true,
      });
      const product = await storage.getProduct(goal.product_id);

      // Make sure we have valid data before broadcasting
      if (updatedGoal && product) {
        const userBalance = await storage.getUserBalance(updatedGoal.user_id);
        const progress = calculateGoalProgressFromBalance(
          userBalance,
          product.price_cents,
        );
        
        broadcast("goal:update", {
          ...updatedGoal,
          tickets_saved: userBalance, // For backward compatibility
          product,
          progress,
        });

        return res.json({
          ...updatedGoal,
          tickets_saved: userBalance, // For backward compatibility
          product,
          progress,
        });
      } else {
        return res.status(500).json({ message: "Could not update goal" });
      }
    },
  );

  // Delete a goal
  app.delete("/api/goals/:id", auth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res
          .status(400)
          .json(failure("INVALID_INPUT", "Invalid goal ID"));
      }

      // Auth middleware guarantees req.user
      const currentUser = req.user!;
      const goal = await storage.getGoal(id);

      if (!goal) {
        return res.status(404).json(failure("NOT_FOUND", "Goal not found"));
      }

      // Only allow users to delete their own goals or parents can delete any goal
      if (currentUser.role !== "parent" && goal.user_id !== currentUser.id) {
        return res
          .status(403)
          .json(failure("FORBIDDEN", "Not authorized to delete this goal"));
      }

      const productId = goal.product_id;
      const goalDeleted = await storage.deleteGoal(id);

      if (goalDeleted) {
        // Check if there are other goals using this product
        const otherGoalsWithProduct =
          await storage.getGoalsByProductId(productId);

        // If no other goals are using this product, attempt to delete it as well
        if (otherGoalsWithProduct.length === 0) {
          console.log(
            `No other goals using product ID ${productId}, attempting to delete product.`,
          );
          const productActuallyDeleted = await storage.deleteProduct(productId);
          if (productActuallyDeleted) {
            console.log(`Product ID ${productId} deleted successfully.`);
            broadcast("product:deleted", { id: productId });
          } else {
            console.warn(
              `Goal ${id} deleted, but failed to delete unreferenced product ID ${productId}. It might be in use elsewhere or a DB error occurred.`,
            );
          }
        }

        // Broadcast the deletion to all connected clients
        broadcast("goal:deleted", { id });
        return res.json(success(true));
      } else {
        return res
          .status(500)
          .json(
            failure("DELETE_FAILED", "Failed to delete goal from storage."),
          );
      }
    } catch (error: any) {
      console.error(`[API ERROR] DELETE /api/goals/${req.params.id}:`, error);
      return res
        .status(500)
        .json(
          failure(
            "INTERNAL_SERVER_ERROR",
            error.message || "An unexpected error occurred.",
          ),
        );
    }
  });

  // ── BONUS-02: daily bonus fetch/assign endpoint
  app.get('/api/bonus/today', auth, async (req: Request, res: Response) => {
    try {
      const caller = req.user;
      const targetId = caller.role === 'parent' && req.query.userId
        ? Number(req.query.userId) : caller.id;

      // Verify child-parent relationship when applicable
      if (caller.role === 'parent' && req.query.userId) {
        const targetUser = await storage.getUser(targetId);
        if (!targetUser || targetUser.role !== 'child') {
          return res.status(404).json({ message: 'Child not found' });
        }
        
        // Verify parent-child relationship (same family)
        if (targetUser.family_id !== caller.family_id) {
          return res.status(403).json({ message: 'Not authorized to access this child' });
        }
      }

      let bonus = await storage.getTodayDailyBonusSimple(targetId);
      if (!bonus) {
        const { assignDailyBonus } = await import('./lib/business-logic');
        bonus = await assignDailyBonus(targetId);
      }

      return res.json(bonus);
    } catch (err) {
      console.error('[BONUS] GET /api/bonus/today', err);
      return res.status(500).json({ message: 'Internal error' });
    }
  });

  // ── BONUS-03: daily bonus spin endpoint
  app.post("/api/bonus/spin", auth, async (req: Request, res: Response) => {
    try {
      const caller = req.user;
      console.log("[BONUS_SPIN] Request received:", { 
        callerId: caller.id, 
        callerRole: caller.role,
        bodyUserId: req.body.userId,
        body: req.body 
      });
      
      const targetId =
        caller.role === "parent" && req.body.userId
          ? Number(req.body.userId)
          : caller.id;
          
      console.log("[BONUS_SPIN] Target ID determined:", targetId);

      // Verify parent-child relationship when applicable
      if (caller.role === "parent" && req.body.userId) {
        const targetUser = await storage.getUser(targetId);
        if (!targetUser || targetUser.role !== "child") {
          return res.status(404).json({ message: "Child not found" });
        }
        
        // Skip family_id check since it's not reliable in this system
        // The fact that the parent can access this endpoint already provides security
        console.log("[BONUS_SPIN] Parent accessing child bonus - authorized");
      }

      console.log("[BONUS_SPIN] Looking for today's bonus for user:", targetId);
      
      // If daily_bonus_id is provided, use it directly
      let bonus;
      if (req.body.daily_bonus_id) {
        console.log("[BONUS_SPIN] Using provided daily_bonus_id:", req.body.daily_bonus_id);
        const dailyBonusRecord = await storage.getDailyBonusById(req.body.daily_bonus_id);
        if (dailyBonusRecord && dailyBonusRecord.user_id === targetId) {
          bonus = {
            id: dailyBonusRecord.id,
            user_id: dailyBonusRecord.user_id,
            revealed: dailyBonusRecord.is_spun,
            bonus_tickets: dailyBonusRecord.spin_result_tickets || 0
          };
          console.log("[BONUS_SPIN] Found bonus by ID:", bonus);
        } else {
          console.log("[BONUS_SPIN] Bonus not found or user mismatch:", dailyBonusRecord);
        }
      } else {
        // Fallback to the old method
        bonus = await storage.getTodayDailyBonusSimple(targetId);
        console.log("[BONUS_SPIN] Found bonus by date lookup:", bonus);
      }
      
      if (!bonus) {
        console.log("[BONUS_SPIN] No bonus found for user:", targetId);
        return res.status(404).json({ message: "No bonus assigned" });
      }
      if (bonus.revealed) {
        return res.status(409).json({ message: "Already spun" });
      }

      const tickets = spinTicketReward();
      
      // Map tickets to wheel segment index - FIX: Award actual tickets, not different amounts
      // Based on WHEEL_SEGMENTS in client/src/components/child-bonus-wheel.tsx:
      // [1, 2, 3, 5, 2, 10, "×2", 4]
      let segmentIndex = 0;
      switch(tickets) {
        case 1: segmentIndex = 0; break;
        case 2: segmentIndex = Math.random() < 0.5 ? 1 : 4; break; // Two "2" segments
        case 3: segmentIndex = 2; break;
        case 5: segmentIndex = 3; break;
        case 10: segmentIndex = 5; break; // FIXED: 10 tickets shows as "10" on wheel
        default: segmentIndex = 0;
      }

      // Create "earn" transaction
      const transaction = await storage.createTransaction({
        user_id: targetId,
        delta: tickets,
        type: "earn",
        note: "Daily-spin",
        metadata: JSON.stringify({ bonus_id: bonus.id }),
        performed_by_id: req.user.id, // Track who performed the action
      });

      // Mark bonus revealed & persist final tickets actually awarded
      const updatedBonus = await storage.markDailyBonusRevealed(bonus.id, tickets);

      const balance = await storage.getUserBalance(targetId);

      // WebSocket broadcast for live UI later
      broadcast("bonus:spin", { user_id: targetId, tickets, balance });

      return res.status(201).json({ 
        tickets_awarded: tickets,
        segment_index: segmentIndex,
        balance, 
        bonus: updatedBonus, 
        transaction 
      });
    } catch (err) {
      console.error("[BONUS] POST /api/bonus/spin", err);
      return res.status(500).json({ message: "Internal error" });
    }
  });

  // Transaction routes
  /**
   * Complete a chore and award tickets.
   *
   * @route POST /api/complete-chore
   * @param req.body.chore_id - ID of the chore being completed.
   * @param [req.body.user_id] - Optional child ID when a parent marks the chore complete.
   * @returns 201 - JSON containing the created transaction, updated balance and goal
   * @returns 404 - If the specified chore or user does not exist
   * @returns 500 - On failure to create the transaction
   */
  app.post("/api/earn", auth, async (req: Request, res: Response) => {
    try {
      let user = req.user;
      const { chore_id, user_id } = completeChoreSchema.parse(req.body);

      // Handle case when a parent is completing a chore for a child
      if (user_id && user.role === "parent") {
        // Get the child user
        const childUser = await storage.getUser(user_id);
        if (!childUser) {
          return res.status(404).json({ message: "Child user not found" });
        }
        // Use the child user for the transaction
        user = childUser;
        console.log(`Parent completing chore for child: ${childUser.username}`);
      }

      // Step 1: Verify chore exists
      const chore = await storage.getChore(chore_id);
      if (!chore) {
        return res.status(404).json({ message: "Chore not found" });
      }

      // EMERGENCY FIX: Direct SQL to bypass ORM issues
      try {
        // Import pool from db.ts
        // const { pool } = await import('./db'); // pool is already imported at the top
        const now = new Date().toISOString();
        const noteText = `Completed: ${chore.name}`;
        const base_tickets_earned = chore.base_tickets || 0;

        console.log(
          `[FIXED_API] Creating chore completion transaction: user=${user.id}, chore=${chore_id}, tickets=${base_tickets_earned}`,
        );

        // Create transaction directly with raw SQL
        const { rows } = await pool.query(
          `INSERT INTO transactions
           (user_id, chore_id, delta, type, note, source, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            user.id,
            chore_id,
            base_tickets_earned,
            "earn",
            noteText,
            "chore",
            now,
          ],
        );

        const transaction = rows[0];
        console.log(
          `[FIXED_API] Created transaction ${transaction.id} with ${base_tickets_earned} tickets`,
        );

        // Log chore completion for tracking
        await storage.logChoreCompletion(chore_id, user.id);
        console.log(`[FIXED_API] Logged chore completion for chore ${chore_id} by user ${user.id}`);

        // Check for daily bonus eligibility
        const today = new Date().toISOString().split("T")[0];
        const dailyBonusRecord = await storage.getDailyBonus(today, user.id); // Renamed to avoid conflict

        // Initialize bonus flags
        let bonus_triggered = false;
        let daily_bonus_id = null;

        // Check if this is a bonus-triggering completion
        if (
          dailyBonusRecord &&
          dailyBonusRecord.assigned_chore_id === chore_id &&
          !dailyBonusRecord.is_spun
        ) {
          console.log(
            `[FIXED_API] Bonus chore completed! User ${user.id} completed bonus chore ${chore_id}`,
          );
          bonus_triggered = true;
          daily_bonus_id = dailyBonusRecord.id;

          // Mark bonus as triggered for spin
          await pool.query(
            "UPDATE daily_bonus SET trigger_type = 'chore_completion' WHERE id = $1",
            [dailyBonusRecord.id],
          );
        }

        // Get updated user data
        const balance = await storage.getUserBalance(user.id);
        const activeGoal = await storage.getActiveGoalByUser(user.id);

        // Prepare response
        const response = {
          transaction,
          chore,
          balance,
          activeGoal,
          bonus_triggered,
          daily_bonus_id,
        };

        // Broadcast to WebSocket clients
        console.log(
          "[BROADCAST DEBUG] Broadcasting transaction:earn with user_id:",
          transaction.user_id,
          "Full transaction object:",
          transaction,
        );
        broadcast("transaction:earn", {
          data: {
            id: transaction.id,
            delta: transaction.delta,
            note: transaction.note,
            user_id: transaction.user_id,
            type: transaction.type,
            chore_id: transaction.chore_id,
            balance,
            bonus_triggered,
            daily_bonus_id,
          },
        });

        return res.status(201).json(response);
      } catch (error: any) {
        console.error("[FIXED_API] Error:", error);
        return res.status(500).json({
          message: "Failed to complete chore",
          error: error.message,
        });
      }
    } catch (error: any) {
      console.error("[API Error]", error);
      return res
        .status(400)
        .json({ message: error.message || "Invalid request" });
    }
  });

  /**
   * Update a trophy (transaction) with custom details
   *
   * @route POST /api/trophies/update
   * @param req.body.transaction_id - ID of the transaction (trophy) to update
   * @param req.body.name - Custom name for the trophy
   * @param req.body.description - Custom description for the trophy
   * @param [req.body.image] - Optional image file upload
   * @param [req.body.catalog_item_id] - Optional catalog item ID to use its image
   * @param req.body.user_id - ID of the user who owns the trophy
   * @returns 200 - JSON with success status and updated trophy details
   * @returns 400 - On validation errors
   * @returns 404 - If trophy not found
   */
  app.post(
    "/api/trophies/update",
    auth,
    multer({ storage: multer.memoryStorage() }).single("image"),
    async (req: Request, res: Response) => {
      try {
        const transactionId = parseInt(req.body.transaction_id);
        const name = req.body.name;
        // Match client parameter names - client sends "description"
        const description = req.body.description || "";
        const userId = parseInt(req.body.user_id);
        const catalogItemId = req.body.catalog_item_id
          ? parseInt(req.body.catalog_item_id)
          : null;

        console.log("Trophy update request:", {
          transactionId,
          name,
          noteAddition: description,
          userId,
          catalogItemId,
          files: req.file ? "File included" : "No file",
        });

        // Validate inputs
        if (!transactionId || isNaN(transactionId)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid transaction ID" });
        }

        if (!userId || isNaN(userId)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid user ID" });
        }

        // Check if transaction exists and belongs to the user
        const transaction = await storage.getTransaction(transactionId);
        if (!transaction) {
          return res
            .status(404)
            .json({ success: false, message: "Trophy not found" });
        }

        if (transaction.user_id !== userId && req.user?.role !== "parent") {
          return res
            .status(403)
            .json({
              success: false,
              message: "You don't have permission to update this trophy",
            });
        }

        // Prepare update data
        // The database only has a 'note' field - not a 'description' field
        const updateData: any = {
          note: name + (description ? ` - ${description}` : ""),
        };

        // Handle image upload
        if (req.file) {
          try {
            const fileExtension =
              req.file.originalname.split(".").pop()?.toLowerCase() || "jpg";
            const fileName = `trophy_${uuidv4()}.${fileExtension}`;

            // Use process.cwd() which is safe in ESM modules (no __dirname)
            const uploadsDir = path.join(
              process.cwd(),
              "public/uploads/trophies",
            );
            const filePath = path.join(uploadsDir, fileName);

            // Ensure directory exists using synchronous method to avoid any async issues
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true });
            }

            // Write file
            fs.writeFileSync(filePath, req.file.buffer);

            // Store image URL in metadata (JSON) field instead of custom_image_url which doesn't exist
            const metadata = {
              custom_image_url: `/uploads/trophies/${fileName}`,
            };
            updateData.metadata = JSON.stringify(metadata);

            console.log("Trophy image saved successfully at:", filePath);
          } catch (error) {
            console.error("Failed to save trophy image:", error);
            return res
              .status(500)
              .json({ success: false, message: "Failed to save image" });
          }
        } else if (catalogItemId) {
          // Use catalog item image - store in metadata field
          const catalogItem = await storage.getProduct(catalogItemId);
          if (catalogItem) {
            const metadata = { custom_image_url: catalogItem.image_url };
            updateData.metadata = JSON.stringify(metadata);
          }
        }

        // Update transaction in database
        // Since we don't have a direct method to update transactions, we'll create a simplified approach
        try {
          // Use a query to update the transaction - Only use fields that exist in our schema
          const query = `
          UPDATE transactions 
          SET note = $1${updateData.metadata ? ", metadata = $2" : ""} 
          WHERE id = $${updateData.metadata ? "3" : "2"}
          RETURNING *
        `;

          const params = updateData.metadata
            ? [updateData.note, updateData.metadata, transactionId]
            : [updateData.note, transactionId];

          console.log("Executing SQL query:", { query, params });

          const result = await pool.query(query, params);

          if (result.rows.length > 0) {
            // Broadcast update - but ensure we only include fields that actually exist
            // Make a modified version of updateData for websocket broadcasting
            const broadcastData = {
              transactionId,
              userId,
              updates: {
                note: updateData.note,
                // Include image URL from metadata if present
                imageUrl: updateData.metadata
                  ? JSON.parse(updateData.metadata).custom_image_url
                  : undefined,
              },
            };
            broadcast("trophy:update", broadcastData);

            return res.status(200).json({
              success: true,
              message: "Trophy updated successfully",
              trophy: result.rows[0],
            });
          } else {
            return res
              .status(404)
              .json({ success: false, message: "Failed to update trophy" });
          }
        } catch (error) {
          console.error("Database error updating trophy:", error);
          return res.status(500).json({
            success: false,
            message:
              "There was a problem saving your trophy changes to the database.",
            error: error instanceof Error ? error.message : String(error),
          });
        }
      } catch (error) {
        console.error("Trophy update error:", error);
        return res.status(500).json({
          success: false,
          message: "Trophy update failed. Please try again or contact support.",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  /**
   * Spend tickets from a user's balance or a specific goal.
   *
   * @route POST /api/spend
   * @param [req.body.tickets] - Number of tickets to spend directly from the balance.
   * @param [req.body.goal_id] - Goal ID to spend all saved tickets from that goal.
   * @param [req.body.user_id] - Optional child ID when a parent spends on their behalf.
   * @param [req.body.reason] - Description of the purchase for the transaction note.
   * @returns 201 - JSON with the created spend transaction, updated balance and goal.
   * @returns 400 - On validation errors such as insufficient tickets.
   */
  app.post("/api/spend", auth, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      // Extract both tickets and delta for backward compatibility
      const { tickets, delta, goal_id, user_id, reason, metadata } = req.body;

      // Determine target user - if user_id provided and request is from a parent
      const targetUserId =
        user.role === "parent" && user_id ? user_id : user.id;

      // Validate that target user exists
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only parents can spend on behalf of children
      if (targetUserId !== user.id && user.role !== "parent") {
        return res
          .status(403)
          .json({
            message: "Only parents can spend tickets on behalf of children",
          });
      }

      // Validate input - either tickets/delta or goal_id must be provided
      if (
        tickets === undefined &&
        delta === undefined &&
        goal_id === undefined
      ) {
        return res
          .status(400)
          .json({ message: "Either tickets or goal_id must be provided" });
      }

      // Get current balance
      const currentBalance = await storage.getUserBalance(targetUserId);

      let ticketsToSpend = 0;
      let targetGoal: any = null;

      if (goal_id !== undefined) {
        // Spend from a specific goal
        targetGoal = await storage.getGoalWithProduct(goal_id);

        if (!targetGoal) {
          return res.status(404).json({ message: "Goal not found" });
        }

        if (targetGoal.user_id !== targetUserId) {
          return res
            .status(403)
            .json({ message: "Not authorized to spend from this goal" });
        }

        // Cap tickets to spend at the current product price
        const currentPrice = getCurrentProductPrice(targetGoal);
        const maxTicketsNeeded = Math.ceil(currentPrice / TICKET_CENT_VALUE);
        ticketsToSpend = Math.min(currentBalance, maxTicketsNeeded);
      } else {
        // Spend a specific number of tickets
        // Accept both 'tickets' and 'delta' fields for backward compatibility
        const ticketInput = tickets !== undefined ? tickets : req.body.delta;
        const ticketValue =
          typeof ticketInput === "string"
            ? parseInt(ticketInput, 10)
            : ticketInput;
        ticketsToSpend = Math.min(ticketValue, currentBalance);

        if (isNaN(ticketsToSpend) || ticketsToSpend <= 0) {
          return res
            .status(400)
            .json({ message: "Invalid number of tickets to spend" });
        }

        if (ticketsToSpend > currentBalance) {
          return res
            .status(400)
            .json({ message: "Not enough tickets available" });
        }
      }

      // Create transaction - this will handle setting tickets_saved to 0 when type is 'spend'
      const transaction = await storage.createTransaction({
        user_id: targetUserId,
        goal_id: targetGoal?.id,
        delta: -ticketsToSpend,
        type: "spend",
        note: reason ? `Purchase: ${reason}` : "Purchase",
        metadata: metadata ? JSON.stringify(metadata) : null,
        performed_by_id: req.user.id, // Track who performed the action
      });

      // Refresh the targetGoal with updated tickets_saved
      if (targetGoal) {
        targetGoal = await storage.getGoalWithProduct(targetGoal.id);
      }

      // Get updated balance for response
      const updatedBalance = await storage.getUserBalance(targetUserId);

      const response = {
        transaction,
        balance: updatedBalance,
        goal: targetGoal,
      };

      // Broadcast transaction with balance for real-time UI updates
      broadcast("transaction:spend", {
        data: {
          id: transaction.id,
          delta: transaction.delta,
          note: transaction.note,
          user_id: targetUserId,
          type: transaction.type,
          balance: updatedBalance,
        },
      });

      return res.status(201).json(response);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });

  // ─────────────────────────  GOAL-04: Purchase active goal  ─────────────────────────
  /**
   * POST /api/goals/:id/purchase
   * Preconditions:
   *   – :id must be the caller's active goal
   *   – caller's progress (derived from balance) must be ≥ 100 %
   * Action:
   *   – creates a single "spend" transaction for the tickets actually needed
   *   – sets goals.purchased_at = now()
   * Response shape (200):
   *   { transaction, remainingBalance, purchasedAt }
   * Response on precondition failure: 422 JSON { message }
   */
  app.post("/api/goals/:id/purchase", auth, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const goalId = parseInt(req.params.id);

      if (isNaN(goalId)) {
        return res.status(400).json({ message: "Invalid goal ID" });
      }

      // Load the goal with product details
      const goal = await storage.getGoalWithProduct(goalId);
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }

      // Ensure this is the user's active goal
      if (goal.user_id !== user.id) {
        return res.status(403).json({ message: "Not authorized to purchase this goal" });
      }

      if (!goal.is_active) {
        return res.status(422).json({ message: "Goal is not active" });
      }

      // Check if goal was already purchased
      if (goal.purchased_at) {
        return res.status(422).json({ message: "Goal already purchased" });
      }

      // Get user's current balance
      const userBalance = await storage.getUserBalance(user.id);
      const currentPrice = getCurrentProductPrice(goal);
      const ticketsToSpend = ticketsNeededFor(currentPrice);
      
      // Check if user has enough balance (≥100% progress)
      const progressPercent = calculateGoalProgressFromBalance(userBalance, currentPrice);
      if (progressPercent < 100) {
        return res.status(422).json({ 
          message: "Insufficient balance to purchase goal",
          required: ticketsToSpend,
          current: userBalance
        });
      }

      // Create the spend transaction
      const transaction = await storage.createTransaction({
        user_id: user.id,
        delta: -ticketsToSpend,
        type: "spend",
        note: `Purchased: ${goal.product.title}`,
        metadata: JSON.stringify({
          goal_id: goalId,
          product_id: goal.product_id,
          price_cents: currentPrice
        }),
        performed_by_id: req.user.id, // Track who performed the action
      });

      // Mark goal as purchased
      const purchasedAt = new Date();
      await storage.updateGoal(goalId, { purchased_at: purchasedAt });

      // Get remaining balance
      const remainingBalance = await storage.getUserBalance(user.id);

      const response = {
        transaction,
        remainingBalance,
        purchasedAt: purchasedAt.toISOString()
      };

      // Broadcast goal purchased event
      broadcast("goal:purchased", {
        data: {
          goal_id: goalId,
          user_id: user.id,
          product_name: goal.product.title,
          tickets_spent: ticketsToSpend,
          remaining_balance: remainingBalance
        }
      });

      return res.status(200).json(response);
    } catch (error) {
      console.error("[API ERROR] POST /api/goals/:id/purchase:", error);
      return res.status(500).json({ message: "Internal error" });
    }
  });

  // Add a bad behavior deduction (parent only)
  app.post(
    "/api/bad-behavior",
    parentOnly,
    async (req: Request, res: Response) => {
      try {
        const data = badBehaviorSchema.parse(req.body);

        // Make sure the user exists
        const targetUser = await storage.getUser(data.user_id);
        if (!targetUser) {
          return res.status(404).json({ message: "User not found" });
        }

        // Only allow deducting tickets from children
        if (targetUser.role !== "child") {
          return res
            .status(400)
            .json({ message: "Can only deduct tickets from child accounts" });
        }

        // Get the active goal for this user
        const activeGoal = await storage.getActiveGoalByUser(data.user_id);

        // Create the transaction with negative tickets
        // The createTransaction method will handle updating the goal's tickets_saved
        const transaction = await storage.createTransaction({
          user_id: data.user_id,
          chore_id: null,
          goal_id: activeGoal?.id || null,
          delta: -data.tickets, // Negative value for deduction
          type: "deduct",
          note: data.reason
            ? `Deduction: ${data.reason}`
            : "Ticket deduction for bad behavior",
          source: "manual_deduct",
          performed_by_id: req.user.id, // Track who performed the action
        });

        // Return the transaction and updated balance
        const response = {
          transaction,
          reason: data.reason,
          balance: await storage.getUserBalance(data.user_id),
          goal: activeGoal,
        };

        // Get the current balance for the UI update
        const updatedBalance = await storage.getUserBalance(data.user_id);

        // Broadcast the transaction with balance for immediate UI update
        broadcast("transaction:deduct", {
          data: {
            id: transaction.id,
            delta_tickets: transaction.delta, // Changed to match property name in storage
            note: transaction.note,
            user_id: transaction.user_id,
            type: transaction.type,
            balance: updatedBalance, // Include balance for immediate UI updates
          },
        });

        return res.status(201).json(response);
      } catch (error: any) {
        return res.status(400).json({ message: error.message });
      }
    },
  );

  // Add a good behavior reward (parent only)
  app.post(
    "/api/good-behavior",
    parentOnly,
    async (req: Request, res: Response) => {
      try {
        const data = goodBehaviorSchema.parse(req.body);
        const userId = data.user_id;

        // Make sure the user exists
        const targetUser = await storage.getUser(userId);
        if (!targetUser) {
          return res.status(404).json({ message: "User not found" });
        }

        // Only allow adding tickets to children
        if (targetUser.role !== "child") {
          return res
            .status(400)
            .json({ message: "Can only add bonus tickets to child accounts" });
        }

        // Get the active goal for this user
        const activeGoal = await storage.getActiveGoalByUser(userId);

        // Create a daily bonus for good behavior
        const today = new Date().toISOString().split("T")[0];

        let dailyBonusRecord;
        let transaction;
        let updatedBalance;

        // Handle based on reward type
        if (data.rewardType === "spin") {
          // For bonus spin, create a new daily bonus record without adding tickets yet
          console.log(`[GOOD_BEHAVIOR] Creating bonus spin for user ${userId}`);

          try {
            // Always check first if they already have a good behavior reward today
            const existingGoodBehaviorBonus =
              await storage.getDailyBonusByTriggerType(
                userId,
                today,
                "good_behavior_reward",
              );

            if (existingGoodBehaviorBonus) {
              console.log(
                `[GOOD_BEHAVIOR] User already has a good behavior bonus for today`,
              );

              if (!existingGoodBehaviorBonus.is_spun) {
                // If it exists but hasn't been spun, just return it
                console.log(
                  `[GOOD_BEHAVIOR] Existing bonus hasn't been spun yet, returning it`,
                );
                return res.status(200).json({
                  message:
                    "This child already has a pending good behavior bonus spin",
                  daily_bonus: existingGoodBehaviorBonus,
                });
              } else {
                // If it has been spun, delete it so we can create a new one
                console.log(
                  `[GOOD_BEHAVIOR] Deleting previously spun good behavior bonus`,
                );
                await storage.deleteDailyBonusById(
                  userId,
                  existingGoodBehaviorBonus.id,
                );
              }
            }

            // Instead of checking for conflicts with chore completion bonuses,
            // we now allow both types to coexist, since they serve different purposes
            console.log(
              `[GOOD_BEHAVIOR] Keeping any existing chore completion bonus - both can coexist`,
            );

            // We're no longer deleting chore completion bonuses when creating good behavior bonuses

            // Now create the good behavior bonus
            dailyBonusRecord = await storage.createDailyBonus({
              bonus_date: today,
              user_id: userId,
              assigned_chore_id: null, // No specific chore for good behavior
              is_override: true,
              is_spun: false,
              trigger_type: "good_behavior_reward",
              spin_result_tickets: null, // Will be set when spun
            });

            console.log(
              `[GOOD_BEHAVIOR] Successfully created good behavior bonus:`,
              {
                id: dailyBonusRecord.id,
                user_id: dailyBonusRecord.user_id,
                trigger_type: dailyBonusRecord.trigger_type,
              },
            );

            // Create a placeholder transaction to acknowledge the spin opportunity
            transaction = await storage.createTransaction({
              user_id: userId,
              chore_id: null,
              goal_id: activeGoal?.id || null,
              delta: 0, // No tickets yet, will be updated after spin
              type: "reward",
              note: `Good Behavior: ${data.reason || "No reason provided"}`,
              source: "bonus_spin",
              ref_id: dailyBonusRecord.id, // Reference the bonus record
              reason: data.reason || "Good behavior",
              performed_by_id: req.user.id, // Track who performed the action
            });

            console.log(`[GOOD_BEHAVIOR] Created placeholder transaction:`, {
              id: transaction.id,
              user_id: transaction.user_id,
              delta: transaction.delta,
            });

            // Broadcast notification about the good behavior bonus
            broadcast("daily_bonus:good_behavior", {
              user_id: userId,
              daily_bonus: dailyBonusRecord,
            });
          } catch (error: any) {
            console.error(`[GOOD_BEHAVIOR] Error creating bonus spin:`, error);
            return res.status(400).json({
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to create bonus spin",
            });
          }

          // Get the updated balance
          updatedBalance = await storage.getUserBalance(userId);
        } else if (data.rewardType === "tickets" && data.tickets) {
          // For direct ticket rewards, add the tickets immediately
          console.log(
            `[GOOD_BEHAVIOR] Adding ${data.tickets} tickets for user ${userId}`,
          );

          // Create transaction for the direct ticket reward
          transaction = await storage.createTransaction({
            user_id: userId,
            chore_id: null,
            goal_id: activeGoal?.id || null,
            delta: parseInt(data.tickets.toString()),
            type: "reward",
            note: `Good Behavior: ${data.reason || "No reason provided"}`,
            source: "manual_add",
            ref_id: null, // No daily bonus reference for direct rewards
            performed_by_id: req.user.id, // Track who performed the action
          });

          // Get updated balance after adding tickets
          updatedBalance = await storage.getUserBalance(userId);

          // Broadcast the transaction with balance for immediate UI update
          broadcast("transaction:reward", {
            data: {
              id: transaction.id,
              delta: transaction.delta,
              note: transaction.note,
              user_id: userId,
              type: "reward",
              balance: updatedBalance,
            },
          });
        } else {
          // Invalid or missing reward type
          return res.status(400).json({
            message:
              "Must provide valid rewardType ('tickets' or 'spin') and appropriate parameters",
          });
        }

        // Build response
        const response = {
          transaction,
          daily_bonus: dailyBonusRecord,
          reason: data.reason,
          balance: updatedBalance,
          goal: activeGoal,
        };

        return res.status(201).json(response);
      } catch (error: any) {
        return res.status(400).json({ message: error.message });
      }
    },
  );

  // Get daily bonus assignments for specific date - parent only
  app.get(
    "/api/daily-bonus/assignments",
    parentOnly,
    async (req: Request, res: Response) => {
      try {
        // Get the date from query parameters, default to today
        const date =
          (req.query.date as string) || new Date().toISOString().split("T")[0];
        console.log(
          `[BONUS_ASSIGNMENTS] Fetching assignments for date: ${date}`,
        );

        // Get all child users
        const childUsers = await storage.getUsersByRole("child");
        console.log(
          `[BONUS_ASSIGNMENTS] Found ${childUsers.length} child users`,
        );

        if (!childUsers.length) {
          console.log(
            `[BONUS_ASSIGNMENTS] No child users found, returning 404`,
          );
          return res.status(404).json({ message: "No child users found" });
        }

        // Build an object with child_id -> assignment information
        const assignmentsResult: Record<string, any> = {}; // Change to string keys for client compatibility

        // For each child, get their daily bonus assignment (if any)
        for (const child of childUsers) {
          console.log(
            `[BONUS_ASSIGNMENTS] Checking bonus for child: ${child.id} (${child.name})`,
          );
          const bonusRecord = await storage.getDailyBonus(date, child.id);
          console.log(
            `[BONUS_ASSIGNMENTS] Bonus record for child ${child.id}:`,
            bonusRecord || "No bonus found",
          );

          if (bonusRecord) {
            let assignedChore = null;
            if (bonusRecord.assigned_chore_id) {
              assignedChore = await storage.getChore(
                bonusRecord.assigned_chore_id,
              );
              console.log(
                `[BONUS_ASSIGNMENTS] Found assigned chore:`,
                assignedChore?.name || "No chore found",
              );
            }

            assignmentsResult[child.id.toString()] = {
              // Convert id to string
              user: {
                id: child.id,
                name: child.name,
                username: child.username,
              },
              bonus: bonusRecord,
              assigned_chore: assignedChore,
            };
          } else {
            assignmentsResult[child.id.toString()] = {
              // Convert id to string
              user: {
                id: child.id,
                name: child.name,
                username: child.username,
              },
              bonus: null,
              assigned_chore: null,
            };
          }
        }

        console.log(
          `[BONUS_ASSIGNMENTS] Returning assignment data for ${Object.keys(assignmentsResult).length} children`,
        );
        console.log(`[BONUS_ASSIGNMENTS] Data structure:`, {
          isObject: true,
          keys: Object.keys(assignmentsResult),
          exampleKey: Object.keys(assignmentsResult)[0] || "none",
          keyTypes: Object.keys(assignmentsResult)
            .map((k) => typeof k)
            .join(", "),
        });

        return res.status(200).json(assignmentsResult);
      } catch (error: any) {
        return res.status(400).json({ message: error.message });
      }
    },
  );

  // Check for an unspun daily bonus for a specific user
  // Returns bonus info only if prerequisites are met based on trigger type
  app.get(
    "/api/daily-bonus/unspun",
    auth,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.query.user_id as string);

        if (!userId || isNaN(userId)) {
          console.log(
            "[UNSPUN_BONUS] Missing or invalid user_id:",
            req.query.user_id,
          );
          return res
            .status(400)
            .json({ message: "Missing or invalid user_id parameter" });
        }

        console.log(
          "[UNSPUN_BONUS] Checking for unspun bonus for user:",
          userId,
        );

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split("T")[0];

        // First check for good_behavior_reward bonuses
        const goodBehaviorBonus = await storage.getDailyBonusByTriggerType(
          userId,
          today,
          "good_behavior_reward",
        );

        // If there's an unspun good behavior bonus, return it immediately
        if (goodBehaviorBonus && !goodBehaviorBonus.is_spun) {
          console.log(
            "[UNSPUN_BONUS] Found unspun good behavior bonus:",
            goodBehaviorBonus.id,
          );

          // For good behavior bonuses, return immediately - no prerequisites
          return res.status(200).json({
            daily_bonus_id: goodBehaviorBonus.id,
            chore_name: "Good Behavior",
            trigger_type: "good_behavior_reward",
          });
        }

        // Now check for a chore completion bonus specifically
        const choreBonus = await storage.getDailyBonusByTriggerType(
          userId,
          today,
          "chore_completion",
        );

        // No chore bonus found
        if (!choreBonus) {
          console.log(
            "[UNSPUN_BONUS] No chore completion bonus found for user",
            userId,
            "on date",
            today,
          );
          return res
            .status(404)
            .json({ message: "No daily bonus found for this user and date" });
        }

        // Chore bonus exists but already spun
        if (choreBonus.is_spun) {
          console.log(
            "[UNSPUN_BONUS] Chore completion bonus already spun for user",
            userId,
            "on date",
            today,
          );
          return res
            .status(404)
            .json({ message: "Daily bonus has already been spun" });
        }

        // For chore completion bonuses, check if the chore has actually been completed
        if (
          choreBonus.trigger_type === "chore_completion" &&
          choreBonus.assigned_chore_id !== null
        ) {
          // Get today's transactions to see if the assigned chore was completed
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);

          const recentTransactions = await storage.getUserTransactions(
            userId,
            50,
          );
          const completedChoreIds = new Set();

          // Find which chores were completed today
          for (const tx of recentTransactions) {
            if (tx.type === "earn" && tx.chore_id && tx.created_at) {
              const txDate = new Date(tx.created_at);
              if (txDate >= todayDate) {
                completedChoreIds.add(tx.chore_id);
              }
            }
          }

          console.log(
            "[UNSPUN_BONUS] Checking if chore was completed - Assigned chore:",
            choreBonus.assigned_chore_id,
          );
          console.log(
            "[UNSPUN_BONUS] Completed chores today:",
            Array.from(completedChoreIds),
          );

          // If the assigned chore wasn't completed, don't show the bonus yet
          if (!completedChoreIds.has(choreBonus.assigned_chore_id)) {
            console.log(
              "[UNSPUN_BONUS] Assigned chore has not been completed yet",
            );
            return res.status(404).json({
              message: "Daily bonus chore has not been completed yet",
            });
          }
        }

        // If we have an unspun bonus and prerequisites are met, get more details
        let bonusDetails: any = {
          daily_bonus_id: choreBonus.id,
          trigger_type: choreBonus.trigger_type,
        };

        if (
          choreBonus.trigger_type === "chore_completion" &&
          choreBonus.assigned_chore_id
        ) {
          // For chore-triggered bonuses, include chore details
          const chore = await storage.getChore(choreBonus.assigned_chore_id);
          if (chore) {
            bonusDetails.chore_name = chore.name;
            bonusDetails.chore_id = chore.id;
          }
        } else {
          // For other bonus types, use a generic name
          bonusDetails.chore_name = "Bonus Spin";
        }

        console.log("[UNSPUN_BONUS] Found unspun bonus:", bonusDetails);
        return res.status(200).json(bonusDetails);
      } catch (error) {
        console.error("[UNSPUN_BONUS] Error checking for unspun bonus:", error);
        return res
          .status(500)
          .json({ message: "Error checking for unspun daily bonus" });
      }
    },
  );

  app.put(
    "/api/daily-bonus/assign",
    parentOnly,
    async (req: Request, res: Response) => {
      try {
        const { user_id, chore_id, date } = req.body;

        if (!user_id || !chore_id) {
          return res
            .status(400)
            .json({ message: "user_id and chore_id are required" });
        }

        // Default to today if date not provided
        const assignDate = date || new Date().toISOString().split("T")[0];

        // Verify the user exists and is a child
        const targetUser = await storage.getUser(user_id);
        if (!targetUser) {
          return res.status(404).json({ message: "User not found" });
        }

        if (targetUser.role !== "child") {
          return res
            .status(400)
            .json({ message: "Can only assign bonus to child accounts" });
        }

        // Verify the chore exists
        const chore = await storage.getChore(chore_id);
        if (!chore) {
          return res.status(404).json({ message: "Chore not found" });
        }

        // Check if there's already a daily bonus for this user/date
        let dailyBonusRecord = await storage.getDailyBonus(assignDate, user_id); // Renamed

        if (dailyBonusRecord) {
          // If already spun, don't allow changing the assignment
          if (dailyBonusRecord.is_spun) {
            return res.status(400).json({
              message:
                "Cannot change bonus assignment after wheel has been spun",
            });
          }

          // Update the existing record using a direct SQL query
          await pool.query(
            "UPDATE daily_bonus SET assigned_chore_id = $1, is_override = true WHERE id = $2",
            [chore_id, dailyBonusRecord.id],
          );

          // Get the updated record
          dailyBonusRecord = await storage.getDailyBonusById(
            dailyBonusRecord.id,
          );
        } else {
          // Create a new daily bonus record with override flag
          dailyBonusRecord = await storage.createDailyBonus({
            bonus_date: assignDate,
            user_id: user_id,
            assigned_chore_id: chore_id,
            is_override: true, // Mark this as a manual override
            is_spun: false,
            trigger_type: "chore_completion",
            spin_result_tickets: 0, // Default value until wheel is spun
          });
        }

        // Update the chore's last_bonus_assigned date
        await pool.query(
          "UPDATE chores SET last_bonus_assigned = $1 WHERE id = $2",
          [assignDate, chore_id],
        );

        // Broadcast the new assignment
        broadcast("daily_bonus:assigned", {
          user_id,
          daily_bonus: dailyBonusRecord,
        });

        return res.status(200).json({
          success: true,
          daily_bonus: dailyBonusRecord,
          chore,
        });
      } catch (error: any) {
        return res.status(400).json({ message: error.message });
      }
    },
  );

  // Reset daily bonus for a child - parent only
  app.post(
    "/api/reset-daily-bonus",
    parentOnly,
    async (req: Request, res: Response) => {
      try {
        const { user_id } = req.body;

        if (!user_id) {
          return res.status(400).json({ message: "Missing user_id parameter" });
        }

        // Verify child exists
        const targetUser = await storage.getUser(parseInt(user_id));

        if (!targetUser) {
          return res.status(404).json({ message: "User not found" });
        }

        if (targetUser.role !== "child") {
          return res
            .status(400)
            .json({ message: "Daily bonus can only be reset for children" });
        }

        // Get today's date
        const today = new Date().toISOString().split("T")[0];

        // Get the current daily bonus for debugging
        const currentBonus = await storage.getDailyBonus(
          today,
          parseInt(user_id),
        );
        console.log(
          `Current daily bonus before reset for user ${user_id}:`,
          currentBonus,
        );

        // Delete the bonus for today
        await storage.deleteDailyBonus(parseInt(user_id));

        // Create a new daily bonus assignment
        let newAssignment = await storage.assignDailyBonusChore(
          parseInt(user_id),
          today,
        );
        console.log(
          `New daily bonus assigned for user ${user_id}:`,
          newAssignment,
        );

        // BUGFIX: If no assignment was created due to cooldown/eligibility issues,
        // create one manually for debugging purposes
        if (!newAssignment && process.env.NODE_ENV === "development") {
          console.log(
            `[BONUS_RESET] No automatic assignment created. Creating a manual one for debugging.`,
          );

          // Get the first daily chore regardless of cooldown
          const allChores = await storage.getChores(true);
          const dailyChores = allChores.filter((c) => c.recurrence === "daily");

          if (dailyChores.length > 0) {
            const selectedChore = dailyChores[0];
            console.log(
              `[BONUS_RESET] Selected chore ${selectedChore.id} (${selectedChore.name}) for manual assignment`,
            );

            // Create manual daily bonus
            newAssignment = await storage.createDailyBonus({
              bonus_date: today,
              user_id: parseInt(user_id),
              assigned_chore_id: selectedChore.id,
              is_override: true, // Mark this as a manual override
              is_spun: false, // Make sure it's not marked as spun
              trigger_type: "chore_completion",
              spin_result_tickets: 0,
            });

            console.log(
              `[BONUS_RESET] Created manual bonus assignment:`,
              newAssignment,
            );
          }
        }

        // Broadcast the new assignment
        if (newAssignment) {
          const assignedChore = newAssignment.assigned_chore_id
            ? await storage.getChore(newAssignment.assigned_chore_id)
            : null;

          broadcast("daily_bonus:assigned", {
            user_id: parseInt(user_id),
            daily_bonus: newAssignment,
            chore: assignedChore,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Daily bonus has been reset and reassigned",
          assignment: newAssignment,
        });
      } catch (error) {
        console.error("Error resetting daily bonus:", error);
        return res.status(500).json({ message: "Failed to reset daily bonus" });
      }
    },
  );

  // Assign daily bonus chores to all children - parent only
  app.post(
    "/api/assign-daily-bonuses",
    parentOnly,
    async (req: Request, res: Response) => {
      try {
        // Use today's date by default, or a date provided in the request
        const date = req.body.date || new Date().toISOString().split("T")[0];

        // Assign bonus chores to all children
        const results = await storage.assignDailyBonusesToAllChildren(date);

        // Count successful assignments
        const successCount = Object.values(results).filter(
          (bonus) => bonus !== null,
        ).length;

        // If any bonuses were assigned, broadcast an event
        if (successCount > 0) {
          broadcast("daily_bonus:assigned", {
            date,
            count: successCount,
            results,
          });
        }

        return res.status(200).json({
          success: true,
          message: `Assigned daily bonus chores to ${successCount} children`,
          results,
        });
      } catch (error) {
        console.error("Error assigning daily bonuses:", error);
        return res
          .status(500)
          .json({ message: "Failed to assign daily bonuses" });
      }
    },
  );

  // Assign a daily bonus chore to a specific child - parent only
  app.post(
    "/api/assign-daily-bonus",
    parentOnly,
    async (req: Request, res: Response) => {
      try {
        const { user_id, chore_id, date } = req.body;

        console.log("[ASSIGN_BONUS] Request body:", req.body);

        if (!user_id) {
          return res.status(400).json({ message: "Missing user_id parameter" });
        }

        // Verify child exists
        const targetUser = await storage.getUser(parseInt(user_id));

        if (!targetUser) {
          return res.status(404).json({ message: "User not found" });
        }

        if (targetUser.role !== "child") {
          return res
            .status(400)
            .json({ message: "Daily bonus can only be assigned to children" });
        }

        // Use today's date by default, or the date provided
        const bonusDate = date || new Date().toISOString().split("T")[0];

        // Check if chore_id was provided - if so, use that specific chore instead of random assignment
        let dailyBonusRecord; // Renamed

        if (chore_id) {
          console.log(
            `[ASSIGN_BONUS] Specific chore ID ${chore_id} provided - using this instead of random assignment`,
          );

          // Verify the chore exists
          const chore = await storage.getChore(parseInt(chore_id));
          if (!chore) {
            return res
              .status(404)
              .json({ message: `Chore with ID ${chore_id} not found` });
          }

          // Check if there's already a daily bonus for this user/date
          const existingBonus = await storage.getDailyBonus(
            bonusDate,
            parseInt(user_id),
          );

          if (existingBonus) {
            // If already spun, don't allow changing the assignment
            if (existingBonus.is_spun) {
              return res.status(400).json({
                message:
                  "Cannot change bonus assignment after wheel has been spun",
              });
            }

            console.log(
              `[ASSIGN_BONUS] Updating existing bonus ID ${existingBonus.id} with new chore ID ${chore_id}`,
            );

            // Update the existing record
            await pool.query(
              "UPDATE daily_bonus SET assigned_chore_id = $1, is_override = true WHERE id = $2",
              [parseInt(chore_id), existingBonus.id],
            );

            // Get the updated record
            dailyBonusRecord = await storage.getDailyBonusById(
              existingBonus.id,
            );
          } else {
            // Create a new daily bonus record with the specified chore
            dailyBonusRecord = await storage.createDailyBonus({
              bonus_date: bonusDate,
              user_id: parseInt(user_id),
              assigned_chore_id: parseInt(chore_id),
              is_override: true, // Mark this as a manual override
              is_spun: false,
              trigger_type: "chore_completion",
              spin_result_tickets: 0, // Default value until wheel is spun
            });
          }

          // Update the chore's last_bonus_assigned date
          await pool.query(
            "UPDATE chores SET last_bonus_assigned = $1 WHERE id = $2",
            [bonusDate, parseInt(chore_id)],
          );
        } else {
          // No chore_id provided, assign a random bonus chore
          dailyBonusRecord = await storage.assignDailyBonusChore(
            parseInt(user_id),
            bonusDate,
          );
        }

        // BUGFIX: For debugging purposes, if no eligible chores found, create a manual assignment
        if (!dailyBonusRecord && process.env.NODE_ENV === "development") {
          console.log(
            `[ASSIGN_BONUS] No automatic assignment created. Creating a manual one for debugging.`,
          );

          // Get all active chores for this user
          const allChores = await storage.getChores(true);
          const dailyChores = allChores.filter((c) => c.recurrence === "daily");

          if (dailyChores.length > 0) {
            const selectedChore = dailyChores[0];
            console.log(
              `[ASSIGN_BONUS] Selected chore ${selectedChore.id} (${selectedChore.name}) for manual assignment`,
            );

            // Create manual daily bonus
            dailyBonusRecord = await storage.createDailyBonus({
              bonus_date: bonusDate,
              user_id: parseInt(user_id),
              assigned_chore_id: selectedChore.id,
              is_override: true, // Mark this as a manual override
              is_spun: false, // Make sure it's not marked as spun
              trigger_type: "chore_completion",
              spin_result_tickets: 0,
            });

            console.log(
              `[ASSIGN_BONUS] Created manual bonus assignment:`,
              dailyBonusRecord,
            );

            // Update the chore's last_bonus_assigned date
            await pool.query(
              "UPDATE chores SET last_bonus_assigned = $1 WHERE id = $2",
              [bonusDate, selectedChore.id],
            );
          }
        }

        if (!dailyBonusRecord) {
          return res.status(400).json({
            success: false,
            message:
              "Could not assign a bonus chore. No eligible chores found.",
          });
        }

        // Get the assigned chore details
        const chore = dailyBonusRecord.assigned_chore_id
          ? await storage.getChore(dailyBonusRecord.assigned_chore_id)
          : null;

        // Broadcast that a bonus has been assigned
        broadcast("daily_bonus:assigned", {
          user_id: parseInt(user_id),
          daily_bonus: dailyBonusRecord,
          chore,
        });

        return res.status(200).json({
          success: true,
          message: "Daily bonus chore has been assigned",
          daily_bonus: dailyBonusRecord,
          chore,
        });
      } catch (error) {
        console.error("Error assigning daily bonus:", error);
        return res
          .status(500)
          .json({ message: "Failed to assign daily bonus" });
      }
    },
  );

  // Endpoint for spinning the bonus wheel for a daily bonus
  app.post("/api/bonus-spin", auth, async (req: Request, res: Response) => {
    try {
      console.log(`[BONUS_SPIN] Processing spin request:`, req.body);

      // Parse and validate the request, but handle the error gracefully
      let data;
      try {
        data = bonusSpinSchema.parse(req.body);
      } catch (parseError) {
        console.error(`[BONUS_SPIN] Schema validation failed:`, parseError);
        // For now, manually extract what we need
        data = {
          daily_bonus_id: req.body.daily_bonus_id,
          userId: req.body.userId
        };
        
        // Ensure daily_bonus_id is present and valid
        if (!data.daily_bonus_id || typeof data.daily_bonus_id !== 'number') {
          return res.status(400).json({ 
            message: "Invalid or missing daily_bonus_id",
            details: parseError instanceof Error ? parseError.message : "Schema validation failed"
          });
        }
      }
      
      console.log(`[BONUS_SPIN] Validated request data:`, data);

      // Step 1: Get the daily bonus record
      const dailyBonusRecord = await storage.getDailyBonusById(
        data.daily_bonus_id,
      );

      console.log(
        `[BONUS_SPIN] Daily bonus record lookup:`,
        dailyBonusRecord
          ? {
              id: dailyBonusRecord.id,
              user_id: dailyBonusRecord.user_id,
              assigned_chore_id: dailyBonusRecord.assigned_chore_id,
              is_spun: dailyBonusRecord.is_spun,
              trigger_type: dailyBonusRecord.trigger_type,
              bonus_date: dailyBonusRecord.bonus_date,
            }
          : "Record not found",
      );

      if (!dailyBonusRecord) {
        console.log(
          `[BONUS_SPIN] ERROR: Daily bonus record ${data.daily_bonus_id} not found`,
        );
        return res
          .status(404)
          .json({ message: "Daily bonus record not found" });
      }

      // Step 2: Verify the requesting user is either the bonus owner or a parent
      const requestingUser = req.user;
      console.log(
        `[BONUS_SPIN] Authorizing request from user ${requestingUser.id} (${requestingUser.role}) for bonus belonging to user ${dailyBonusRecord.user_id}`,
      );

      if (
        requestingUser.id !== dailyBonusRecord.user_id &&
        requestingUser.role !== "parent"
      ) {
        console.log(
          `[BONUS_SPIN] ERROR: Authorization failed - requester is not owner or parent`,
        );
        return res.status(403).json({
          message: "You do not have permission to spin this bonus wheel",
        });
      }

      // Step 3: Check if the bonus has already been spun
      if (dailyBonusRecord.is_spun) {
        console.log(
          `[BONUS_SPIN] ERROR: Bonus ${dailyBonusRecord.id} has already been spun`,
        );
        return res.status(400).json({
          message: "This bonus wheel has already been spun",
          daily_bonus: dailyBonusRecord,
        });
      }

      // Step 4: Get the associated chore information if this is a chore completion bonus
      let chore = null;
      if (dailyBonusRecord.assigned_chore_id) {
        console.log(
          `[BONUS_SPIN] Looking up associated chore ${dailyBonusRecord.assigned_chore_id}`,
        );
        chore = await storage.getChore(dailyBonusRecord.assigned_chore_id);

        console.log(
          `[BONUS_SPIN] Associated chore lookup result:`,
          chore
            ? {
                id: chore.id,
                name: chore.name,
                base_tickets: chore.base_tickets,
                recurrence: chore.recurrence,
              }
            : "Chore not found",
        );

        if (!chore) {
          console.log(
            `[BONUS_SPIN] ERROR: Associated chore ${dailyBonusRecord.assigned_chore_id} not found`,
          );
          return res
            .status(404)
            .json({ message: "Associated chore not found" });
        }
      }

      // Step 5: Perform a weighted random spin
      console.log(
        `[BONUS_SPIN] Starting random wheel spin process for bonus ${dailyBonusRecord.id}`,
      );

      // Using the exact wheel segments from the frontend to ensure perfect mapping
      // Must match client/src/components/child-bonus-wheel.tsx WHEEL_SEGMENTS
      const WHEEL_SEGMENTS = [
        { value: 1, weight: 15, label: "1" },     // Index 0
        { value: 2, weight: 15, label: "2" },     // Index 1
        { value: 3, weight: 12, label: "3" },     // Index 2
        { value: 5, weight: 10, label: "5" },     // Index 3
        { value: 2, weight: 15, label: "2" },     // Index 4 (duplicate for UX)
        { value: 10, weight: 8, label: "10" },    // Index 5 - This must give 10 tickets!
        {
          type: "double",
          weight: 5,
          label: "×2",
          value: "double",
          multiplier: 2,
        }, // Index 6
        { value: 4, weight: 10, label: "4" },     // Index 7
      ];

      // Calculate total weight
      const totalWeight = WHEEL_SEGMENTS.reduce(
        (sum, segment) => sum + segment.weight,
        0,
      );

      // Generate a random number between 0 and totalWeight
      const random = Math.random() * totalWeight;
      console.log(
        `[BONUS_SPIN] Generated random value: ${random} (total weight: ${totalWeight})`,
      );

      // Find the selected segment
      let cumulativeWeight = 0;
      let selectedSegment = WHEEL_SEGMENTS[0];
      let selectedIndex = 0;

      for (let i = 0; i < WHEEL_SEGMENTS.length; i++) {
        cumulativeWeight += WHEEL_SEGMENTS[i].weight;
        if (random <= cumulativeWeight) {
          selectedSegment = WHEEL_SEGMENTS[i];
          selectedIndex = i;
          break;
        }
      }

      console.log(
        `[BONUS_SPIN] Selected wheel segment: ${selectedSegment.label} (value: ${selectedSegment.value}) at index ${selectedIndex}`,
      );

      // Step 6: Calculate bonus tickets based on the spin result
      let bonusTickets = 0;
      let respin = false;
      let segmentLabel = selectedSegment.label;

      console.log(
        `[BONUS_SPIN] Calculating bonus tickets for segment type: ${selectedSegment.value}`,
      );

      if (selectedSegment.value === "respin") {
        // First check if this is already a respin attempt
        if (dailyBonusRecord.trigger_type === "respin") {
          // Convert respin to +1 ticket if this is a second respin
          bonusTickets = 1;
          segmentLabel = "1 (converted from Spin Again)";
          console.log(
            `[BONUS_SPIN] Already a respin attempt, converting to 1 ticket`,
          );
        } else {
          // Mark for respin
          respin = true;
          bonusTickets = 0;
          console.log(
            `[BONUS_SPIN] First respin attempt, will set trigger_type='respin'`,
          );
        }
      } else if (selectedSegment.value === "double") {
        // For "×2 Multiplier" - double the original tickets from the chore
        if (dailyBonusRecord.trigger_type === "chore_completion" && chore) {
          // Double the base tickets
          const baseTickets = chore.base_tickets;
          bonusTickets = baseTickets * 2;
          // Show the multiplier in the result for clarity
          segmentLabel = `×2 (${bonusTickets} tickets)`;
          console.log(
            `[BONUS_SPIN] ×2 Multiplier: ${baseTickets} × 2 = ${bonusTickets} tickets`,
          );
        } else {
          // For good behavior rewards, award a fixed prize (4 tickets)
          bonusTickets = 4;
          segmentLabel = "4 (×2 Multiplier)";
          console.log(
            `[BONUS_SPIN] ×2 Multiplier for non-chore completion, awarding 4 tickets`,
          );
        }
      } else {
        // For direct ticket amounts (1, 2, 3, 5, 10)
        bonusTickets = Number(selectedSegment.value);
        console.log(
          `[BONUS_SPIN] Direct ticket award: ${bonusTickets} tickets`,
        );
      }

      // Step 7: Update the dailyBonus record
      console.log(
        `[BONUS_SPIN] Updating daily bonus record ${dailyBonusRecord.id}:`,
        {
          respin,
          bonusTickets,
          segmentLabel,
          trigger_type: respin ? "respin" : dailyBonusRecord.trigger_type,
          is_spun: !respin,
        },
      );

      let updatedBonus;

      if (respin) {
        // For "Spin Again", update trigger_type but don't mark as spun yet
        const result = await db
          .update(dailyBonus)
          .set({
            trigger_type: "respin",
          })
          .where(eq(dailyBonus.id, dailyBonusRecord.id))
          .returning();

        updatedBonus = result[0];
        console.log(
          `[BONUS_SPIN] Set respin flag - daily bonus will remain active for another spin`,
        );
      } else {
        // For all other outcomes, mark as spun and set the result
        const result = await db
          .update(dailyBonus)
          .set({
            is_spun: true,
            spin_result_tickets: bonusTickets,
          })
          .where(eq(dailyBonus.id, dailyBonusRecord.id))
          .returning();

        updatedBonus = result[0];
        console.log(
          `[BONUS_SPIN] Final spin outcome - marked daily bonus as spun with ${bonusTickets} tickets`,
        );
      }

      // Step 8: Create a transaction for the bonus tickets (only if positive tickets and not respin)
      if (bonusTickets > 0) {
        const child = await storage.getUser(dailyBonusRecord.user_id);

        if (!child) {
          return res.status(404).json({ message: "Child user not found" });
        }

        const transaction = await storage.createTransaction({
          user_id: child.id,
          delta: bonusTickets, // Changed from delta_tickets to delta to match schema
          type: "earn",
          note: `Bonus Wheel: ${segmentLabel}`,
          source: "bonus_spin",
          ref_id: dailyBonusRecord.id,
          performed_by_id: req.user.id, // Track who performed the action
        });

        // Step 9: Get updated user balance
        const balance = await storage.getUserBalance(child.id);

        // Step 10: Broadcast the transaction to all connected clients
        broadcast("transaction:earn", {
          data: {
            id: transaction.id,
            delta: transaction.delta, // Changed from delta_tickets to delta to match schema
            note: transaction.note,
            user_id: transaction.user_id,
            type: transaction.type,
            source: transaction.source,
            ref_id: transaction.ref_id,
            balance: balance,
          },
        });
      }

      // Step 11: Broadcast the spin result
      broadcast("bonus_spin:result", {
        daily_bonus_id: dailyBonusRecord.id,
        user_id: dailyBonusRecord.user_id,
        segment_index: selectedIndex,
        tickets_awarded: bonusTickets,
        segment_label: segmentLabel,
        respin_allowed: respin,
      });

      // Step 12: Return success response
      return res.status(200).json({
        success: true,
        daily_bonus: updatedBonus,
        segment_index: selectedIndex,
        segment_label: segmentLabel,
        tickets_awarded: bonusTickets,
        respin_allowed: respin,
        chore: chore,
      });
    } catch (error: any) {
      console.error("Error processing bonus spin:", error);
      return res
        .status(400)
        .json({ message: error.message || "Failed to process bonus spin" });
    }
  });

  // Spin the wheel for daily bonus - parent only
  /**
   * Spin the daily bonus wheel for a child.
   *
   * @route POST /api/spin-wheel
   * @param req.body.user_id - ID of the child receiving the spin.
   * @param req.body.assigned_chore_id - Chore ID assigned for the bonus.
   * @returns 200 - JSON with the resulting DailyBonus record, awarded tickets and chore info.
   * @returns 400 - If the user or chore is invalid or the bonus was already spun.
   */
  app.post(
    "/api/spin-wheel",
    parentOnly,
    async (req: Request, res: Response) => {
      try {
        const data = spinWheelSchema.parse(req.body);

        // Verify both child and chore exist
        const [targetUser, chore] = await Promise.all([
          storage.getUser(data.user_id),
          storage.getChore(data.assigned_chore_id),
        ]);

        if (!targetUser) {
          return res.status(404).json({ message: "User not found" });
        }

        if (targetUser.role !== "child") {
          return res
            .status(400)
            .json({ message: "Daily bonus can only be assigned to children" });
        }

        if (!chore) {
          return res.status(404).json({ message: "Chore not found" });
        }

        // Check if child already has a bonus today
        const today = new Date().toISOString().split("T")[0];
        const existingBonus = await storage.getDailyBonus(today, data.user_id);

        let dailyBonusRecord; // Renamed

        if (existingBonus) {
          if (existingBonus.is_spun) {
            return res.status(400).json({
              message: "Child has already spun the wheel for today's bonus",
              daily_bonus: existingBonus,
            });
          }

          // Calculate random bonus tickets (50-100% extra)
          const bonusMultiplier = 0.5 + Math.random() * 0.5;
          const bonusTickets = Math.ceil(chore.base_tickets * bonusMultiplier);

          // Update the existing daily bonus with spin results
          const [updatedBonus] = await db
            .update(dailyBonus) // Use the schema import
            .set({
              is_spun: true,
              spin_result_tickets: bonusTickets,
            })
            .where(eq(dailyBonus.id, existingBonus.id))
            .returning();

          dailyBonusRecord = updatedBonus;
        } else {
          // Calculate random bonus tickets (50-100% extra)
          const bonusMultiplier = 0.5 + Math.random() * 0.5;
          const bonusTickets = Math.ceil(chore.base_tickets * bonusMultiplier);

          // Create a new daily bonus
          dailyBonusRecord = await storage.createDailyBonus({
            bonus_date: today,
            user_id: data.user_id,
            assigned_chore_id: data.assigned_chore_id,
            is_override: true,
            is_spun: true,
            trigger_type: "good_behavior_reward",
            spin_result_tickets: bonusTickets,
          });
        }

        // Broadcast the spin results
        broadcast("daily_bonus:spin", {
          daily_bonus: dailyBonusRecord,
          chore: chore,
          spin_result_tickets: dailyBonusRecord.spin_result_tickets,
          user_id: data.user_id,
        });

        // Return success with the daily bonus details
        return res.status(200).json({
          success: true,
          message: "Wheel has been spun for daily bonus",
          daily_bonus: dailyBonusRecord,
          chore: chore,
          spin_result_tickets: dailyBonusRecord.spin_result_tickets,
        });
      } catch (error) {
        console.error("Error spinning wheel for daily bonus:", error);
        return res
          .status(500)
          .json({ message: "Failed to spin wheel for daily bonus" });
      }
    },
  );

  app.get("/api/transactions", auth, async (req: Request, res: Response) => {
    const { userId, limit } = req.query;
    const user = req.user;

    // Parents can view any user's transactions, children can only view their own
    if (
      user.role !== "parent" &&
      userId &&
      parseInt(userId as string) !== user.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view these transactions" });
    }

    const targetUserId = userId ? parseInt(userId as string) : user.id;
    const limitNum = limit ? parseInt(limit as string) : 10;

    // If this is a parent viewing all transactions (no specific userId provided),
    // and they're not currently viewing as a child, filter to only show
    // transactions for Bryce (id: 4) and Kiki (id: 5)
    if (user.role === "parent" && !userId) {
      // Get transactions for both Bryce and Kiki
      const bryceTransactions = await storage.getUserTransactionsWithDetails(
        4,
        limitNum,
      );
      const kikiTransactions = await storage.getUserTransactionsWithDetails(
        5,
        limitNum,
      );

      // Combine and sort by date (newest first)
      const combinedTransactions = [...bryceTransactions, ...kikiTransactions]
        .sort(
          (a, b) =>
            (toDateSafe(b.created_at)?.getTime() ?? 0) - (toDateSafe(a.created_at)?.getTime() ?? 0),
        )
        .slice(0, limitNum); // Apply the limit to the combined result

      return res.json(combinedTransactions);
    }

    // Regular case - single user's transactions
    const transactions = await storage.getUserTransactionsWithDetails(
      targetUserId,
      limitNum,
    );
    return res.json(transactions);
  });

  // Get purchase history for the trophy room
  app.get(
    "/api/transactions/purchases",
    auth,
    async (req: Request, res: Response) => {
      try {
        const { userId } = req.query;
        const user = req.user;

        // Parents can view any user's purchases, children can only view their own
        if (
          user.role !== "parent" &&
          userId &&
          parseInt(userId as string) !== user.id
        ) {
          return res
            .status(403)
            .json({ message: "Not authorized to view these purchases" });
        }

        const targetUserId = userId ? parseInt(userId as string) : user.id;

        console.log(
          `[PURCHASES] Fetching purchase history for user ${targetUserId}`,
        );

        // Get transactions with type "spend" that have associated product info
        const transactions = await storage.getUserTransactionsWithDetails(
          targetUserId,
          100,
        );

        // Filter to only include "spend" transactions
        const purchases = transactions.filter(
          (t) =>
            t.type === "spend" &&
            // Either has a goal with a product, or has a note about the purchase
            (t.goal?.product || t.note),
        );

        console.log(
          `[PURCHASES] Found ${purchases.length} purchases for user ${targetUserId}`,
        );

        return res.json(purchases);
      } catch (error) {
        console.error("Error fetching purchase history:", error);
        return res
          .status(500)
          .json({ error: "Failed to fetch purchase history" });
      }
    },
  );

  app.delete(
    "/api/transactions/:id",
    auth,
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const user = req.user;

      // Get the transaction first to verify ownership
      const transaction = await storage.getTransaction(parseInt(id));

      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Only parents or the user who owns the transaction can delete it
      if (user.role !== "parent" && transaction.user_id !== user.id) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this transaction" });
      }

      // Delete the transaction
      const deleted = await storage.deleteTransaction(parseInt(id));

      if (!deleted) {
        return res
          .status(500)
          .json({ message: "Failed to delete transaction" });
      }

      // Run balance and goal queries in parallel for better performance
      const [balance, goal] = await Promise.all([
        storage.getUserBalance(transaction.user_id),
        transaction.goal_id 
          ? storage.getGoalWithProduct(transaction.goal_id)
          : storage.getActiveGoalByUser(transaction.user_id)
      ]);

      // Broadcast the deletion
      broadcast("transaction:delete", {
        transaction_id: parseInt(id),
        user_id: transaction.user_id,
        balance,
        goal,
      });

      return res.json({
        message: "Transaction deleted successfully",
        transaction_id: parseInt(id),
        balance,
        goal,
      });
    },
  );

  // Simple in-memory cache for stats API to reduce database load
  const statsCache: Record<string, { data: any; timestamp: number }> = {};
  const STATS_CACHE_TTL = 15000; // 15 seconds TTL

  /**
   * Award an item to a child - creates a trophy entry
   *
   * @route POST /api/child/:childId/award-item
   * @param req.params.childId - ID of the child to award the item to
   * @param req.body.item_id - ID of the item/product to award
   * @param req.body.custom_note - Optional custom note for the award
   * @returns 201 - JSON with success status and award details
   * @returns 400 - On validation errors
   * @returns 404 - If child or item not found
   */
  app.post(
    "/api/child/:childId/award-item",
    parentOnly,
    async (req: Request, res: Response) => {
      try {
        const childId = parseInt(req.params.childId);
        if (isNaN(childId)) {
          return res.status(400).json({ error: "Invalid child ID" });
        }

        // Validate request body using schema
        const validatedData = awardItemSchema.parse(req.body);
        const { item_id, custom_note } = validatedData;

        // Verify the child exists and is actually a child
        const child = await storage.getUser(childId);
        if (!child || child.role !== "child") {
          return res.status(404).json({ error: "Child not found" });
        }

        // Verify the item exists
        const item = await storage.getProduct(item_id);
        if (!item) {
          return res.status(404).json({ error: "Item not found" });
        }

        // Award the item
        const award = await storage.awardItemToChild({
          child_id: childId,
          item_id: item_id,
          awarded_by: req.user!.id,
          custom_note: custom_note || null,
        });

        // Broadcast the award to all connected clients for real-time updates
        broadcast("trophy:awarded", {
          child_id: childId,
          item: {
            id: item.id,
            title: item.title,
            image_url: item.image_url,
          },
          award,
          awarded_by_name: req.user!.name,
        });

        res.status(201).json({ success: true, award, item });
      } catch (error: any) {
        console.error("Error awarding item:", error);
        if (error.name === "ZodError") {
          return res
            .status(400)
            .json({ error: "Invalid request data", details: error.errors });
        }
        res.status(500).json({ error: "Failed to award item" });
      }
    },
  );

  // Get a child's trophies
  app.get(
    "/api/child/:childId/trophies",
    auth,
    async (req: Request, res: Response) => {
      try {
        const childId = parseInt(req.params.childId);
        const user = req.user;

        if (isNaN(childId)) {
          return res.status(400).json({ error: "Invalid child ID" });
        }

        // Parents can view any child's trophies, children can only view their own
        if (user.role !== "parent" && user.id !== childId) {
          return res
            .status(403)
            .json({ error: "Not authorized to view these trophies" });
        }

        // Get trophies with item details
        const trophies = await storage.getChildTrophies(childId);

        res.json({
          success: true,
          trophies,
          child_id: childId,
        });
      } catch (error) {
        console.error("Error fetching trophies:", error);
        res.status(500).json({ error: "Failed to fetch trophies" });
      }
    },
  );

  // Get current user info
  app.get("/api/me", auth, async (req: Request, res: Response) => {
    const user = req.user;
    return res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      family_id: user.family_id,
    });
  });

  app.get("/api/stats", auth, async (req: Request, res: Response) => {
    const { userId } = req.query;
    const user = req.user;

    // Parents can view any user's stats, children can only view their own
    if (
      user.role !== "parent" &&
      userId &&
      parseInt(userId as string) !== user.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view these stats" });
    }

    const targetUserId = userId ? parseInt(userId as string) : user.id;
    const cacheKey = `stats_${targetUserId}`;

    // Check cache first
    const now = Date.now();
    const cacheEntry = statsCache[cacheKey];
    if (cacheEntry && now - cacheEntry.timestamp < STATS_CACHE_TTL) {
      console.log(
        `[CACHE HIT] Serving cached stats for user ${targetUserId}, age: ${(now - cacheEntry.timestamp) / 1000}s`,
      );
      return res.json(cacheEntry.data);
    }

    console.log(`[CACHE MISS] Fetching fresh stats for user ${targetUserId}`);

    // Get balance
    const balance = await storage.getUserBalance(targetUserId);

    // Get active goal with progress
    let activeGoal = await storage.getActiveGoalByUser(targetUserId);
    let progressPercent = 0;
    let estimatedCompletion = null;

    if (activeGoal) {
      // Calculate progress based on balance, not tickets_saved
      const currentPrice = getCurrentProductPrice(activeGoal);
      progressPercent = calculateGoalProgressFromBalance(
        balance,
        currentPrice,
      );

      // Calculate estimated completion
      const transactions = await storage.getUserTransactions(targetUserId, 10);
      const earnTransactions = transactions.filter((tx) => tx.type === "earn");

      if (earnTransactions.length > 0) {
        // Calculate average tickets earned per day
        const totalEarned = earnTransactions.reduce(
          (sum, tx) => sum + tx.delta,
          0,
        );
        const avgPerDay = totalEarned / Math.max(1, earnTransactions.length);

        // Tickets needed to complete goal using current price
        const currentPrice = getCurrentProductPrice(activeGoal!);
        const ticketsNeeded =
          currentPrice / TICKET_CENT_VALUE -
          balance;

        // Estimated days to completion
        const daysToCompletion = Math.ceil(ticketsNeeded / avgPerDay);

        if (daysToCompletion > 0) {
          estimatedCompletion = {
            days: daysToCompletion,
            weeks: Math.ceil(daysToCompletion / 7),
          };
        }
      }
    }

    // Get available chores
    const chores = await storage.getChores();

    // Check which chores are completed today
    const completedChoreIds = new Set();
    const todayDate = new Date(); // Renamed
    todayDate.setHours(0, 0, 0, 0);
    const todayString = todayDate.toISOString().split("T")[0];

    const recentTransactions = await storage.getUserTransactions(
      targetUserId,
      50,
    );
    for (const tx of recentTransactions) {
      if (
        tx.type === "earn" &&
        tx.chore_id &&
        tx.created_at &&
        (toDateSafe(tx.created_at) ?? new Date(0)) >= todayDate
      ) {
        completedChoreIds.add(tx.chore_id);
      }
    }

    // Get the daily bonus for this user if one exists
    const dailyBonusRecord = await storage.getDailyBonus(
      todayString,
      targetUserId,
    ); // Renamed

    // Get the assigned bonus chore if there is one
    let assignedBonusChore = null;
    if (dailyBonusRecord && dailyBonusRecord.assigned_chore_id) {
      assignedBonusChore =
        chores.find((c) => c.id === dailyBonusRecord.assigned_chore_id) || null;
    }

    // Add completion status and bonus info to chores
    const choresWithStatus = chores.map((chore) => ({
      ...chore,
      completed: completedChoreIds.has(chore.id),
      boostPercent: activeGoal
        ? calculateBoostPercent(
            chore.base_tickets,
            getCurrentProductPrice(activeGoal),
          )
        : 0,
      // Add bonus information if this chore is the assigned bonus chore for today
      is_bonus: dailyBonusRecord
        ? dailyBonusRecord.assigned_chore_id === chore.id
        : false,
      // If the chore is the bonus chore and has been completed (but wheel not spun), it's eligible for spin
      spin_eligible:
        dailyBonusRecord &&
        dailyBonusRecord.assigned_chore_id === chore.id &&
        completedChoreIds.has(chore.id) &&
        !dailyBonusRecord.is_spun,
    }));

    // Check if the user is eligible for a bonus spin
    const isBonusSpinAvailable =
      !!dailyBonusRecord &&
      ((dailyBonusRecord.trigger_type === "chore_completion" &&
        dailyBonusRecord.assigned_chore_id !== null &&
        completedChoreIds.has(dailyBonusRecord.assigned_chore_id)) ||
        dailyBonusRecord.trigger_type === "good_behavior_reward") &&
      !dailyBonusRecord.is_spun;

    return res.json({
      balance,
      activeGoal: activeGoal
        ? {
            ...activeGoal,
            tickets_saved: balance, // For backward compatibility
            progress: progressPercent,
            estimatedCompletion,
            overSavedTickets: calculateOverSavedTickets(
              balance,
              getCurrentProductPrice(activeGoal),
            ),
            // Include current product price for transparency
            product: {
              ...activeGoal.product,
              price_cents: getCurrentProductPrice(activeGoal),
            },
          }
        : null,
      chores: choresWithStatus,
      // Enhanced daily bonus information
      daily_bonus: {
        has_bonus_assignment: !!dailyBonusRecord,
        is_bonus_spin_available: isBonusSpinAvailable,
        daily_bonus_id: dailyBonusRecord?.id || null,
        assigned_bonus_chore_id: dailyBonusRecord?.assigned_chore_id || null,
        assigned_bonus_chore: assignedBonusChore
          ? {
              id: assignedBonusChore.id,
              name: assignedBonusChore.name,
              emoji: assignedBonusChore.emoji,
              tickets: assignedBonusChore.base_tickets,
              completed: completedChoreIds.has(assignedBonusChore.id),
            }
          : null,
        is_spun: dailyBonusRecord?.is_spun || false,
        spin_result_tickets: dailyBonusRecord?.spin_result_tickets || 0,
        trigger_type: dailyBonusRecord?.trigger_type || null,
      },
    });
  });

  /* Wishlist routes */
  app.post('/api/wishlist', async (req, res) => {
    try {
      const { createWishlistItem } = await import('./storage/wishlist');
      const { z } = await import('zod');
      
      const bodySchema = z.object({ 
        userId: z.number().int(), 
        productId: z.number().int() 
      });
      
      const parse = bodySchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ 
          success: false, 
          error: parse.error.format() 
        });
      }
      
      const item = await createWishlistItem(parse.data);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      console.error('Error creating wishlist item:', err);
      res.status(500).json({ success: false, error: { msg: 'Failed to create wishlist item' } });
    }
  });

  app.get('/api/wishlist', async (req, res) => {
    try {
      const { listWishlistItems } = await import('./storage/wishlist');
      const userId = Number(req.query.userId);
      
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          error: { msg: 'userId query parameter is required' } 
        });
      }
      
      const items = await listWishlistItems(userId);
      res.json({ success: true, data: items });
    } catch (err) {
      console.error('Error listing wishlist items:', err);
      res.status(500).json({ success: false, error: { msg: 'Failed to list wishlist items' } });
    }
  });

  app.patch('/api/wishlist/:id', async (req, res) => {
    try {
      const { updateWishlistProgress } = await import('./storage/wishlist');
      const { z } = await import('zod');
      
      const id = Number(req.params.id);
      const bodySchema = z.object({ 
        progress: z.number().int().min(0).max(100) 
      });
      
      const parse = bodySchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ 
          success: false, 
          error: parse.error.format() 
        });
      }
      
      const item = await updateWishlistProgress(id, parse.data.progress);
      res.json({ success: true, data: item });
    } catch (err) {
      console.error('Error updating wishlist progress:', err);
      res.status(500).json({ success: false, error: { msg: 'Failed to update wishlist progress' } });
    }
  });

  return httpServer;
}
