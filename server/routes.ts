import express, { Request, Response, NextFunction } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db, pool } from "./db";
import path from "path";
import fs from "fs";
import { eq } from "drizzle-orm";
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
  bonusSpinSchema
} from "@shared/schema";
import { createJwt, verifyJwt, AuthMiddleware } from "./lib/auth";
import { DailyBonusAssignmentMiddleware } from "./lib/daily-bonus-middleware";

import { calculateTier, calculateProgressPercent, calculateBoostPercent } from "./lib/business-logic";
import { WebSocketServer, WebSocket } from "ws";
import { cleanupOrphanedProducts } from "./cleanup";
import { success, failure } from "./lib/responses";
import { TICKET_CENT_VALUE } from "../config/business";

import { registerProfileImageRoutes } from "./lib/profile-upload";

function extractAsin(url: string): string {
  const asinPattern = /(?:\/dp\/|\/gp\/product\/|\/ASIN\/|%2Fdp%2F)([A-Z0-9]{10})/i;
  const match = url.match(asinPattern);
  if (match && match[1]) {
    return match[1];
  }
  throw new Error("Could not extract ASIN from URL.");
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Register only one profile image handler - this is the definitive implementation
  console.log("[SETUP] Registering profile image routes (v2)...");
  registerProfileImageRoutes(app);
  console.log("[SETUP] Profile image routes registered successfully");

  // Create an endpoint to refresh the balances of all users
  app.post("/api/transactions/refresh-balances", async (req: Request, res: Response) => {
    try {
      // Get all users
      const allUsers = await storage.getUsers();

      // Update balances for each user
      const results = await Promise.all(
        allUsers.map(async (user) => {
          // Recalculate balance from transactions
          const transactions = await storage.getUserTransactions(user.id);
          const balance = transactions.reduce((sum, t) => sum + t.delta, 0);

          return { userId: user.id, balance };
        })
      );

      console.log('Balances refreshed:', results);
      res.status(200).json(results);
    } catch (error) {
      console.error('Error refreshing balances:', error);
      res.status(500).json({ message: 'Failed to refresh balances' });
    }
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.send('ok');
  });

  // Create directories for uploads if they don't exist
  const uploadsDir = path.join(process.cwd(), 'public/uploads');
  const profilesDir = path.join(uploadsDir, 'profiles');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
  }

  // Serve static files from public folder
  app.use('/uploads', express.static(uploadsDir)); // Changed to use uploadsDir

  // Setup WebSockets for realtime updates with specific path
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws'
  });

  wss.on("connection", (ws: WebSocket) => {
    console.log("New WebSocket connection established");

    ws.on("message", (message: Buffer) => {
      try {
        const { event, data } = JSON.parse(message.toString());
        console.log("WebSocket message received:", event, data);

        // Handle client connection acknowledgment
        if (event === 'client:connected') {
          console.log("Client acknowledged connection");
          // Send a welcome message back to confirm two-way communication
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              event: 'server:welcome',
              data: {
                message: "Welcome to the TicketTracker realtime service",
                timestamp: new Date().toISOString()
              }
            }));
          }
        }

        // Handle ping test messages
        else if (event === 'client:ping') {
          console.log("Received ping test from client");
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              event: 'server:pong',
              data: {
                received: data,
                serverTime: new Date().toISOString(),
                message: "Connection test successful"
              }
            }));

            // Create a real test transaction to help debug UI updates
            const createAndBroadcastTestTransaction = async () => {
              try {
                // Create a real transaction (small reward for testing)
                const testAmount = 5; // 5 tickets as a test reward
                const transaction = await storage.createTransaction({
                  type: 'reward',
                  delta_tickets: testAmount, // Must use delta_tickets, not amount
                  note: 'WebSocket test reward (connection test)',
                  user_id: 1 // Parent user ID
                });

                console.log("Created real test transaction:", transaction.id);

                // Broadcast the real transaction to all clients
                broadcast('transaction:reward', {
                  id: transaction.id,
                  type: 'reward',
                  delta_tickets: testAmount,
                  note: 'WebSocket test reward (connection test)',
                  user_id: 1
                });
              } catch (error) {
                console.error("Failed to create test transaction:", error);

                // Fall back to dummy transaction if real one fails
                broadcast('transaction:test', {
                  id: 999999,
                  type: 'test',
                  delta_tickets: 5,  // Using 5 tickets to match the real transaction
                  note: 'WebSocket test transaction (dummy)',
                  user_id: 1
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
        JSON.stringify(data, null, 2)
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
      `Broadcast complete: ${sent}/${wss.clients.size} client(s) reached`
    );
  }

  // Auth Routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(credentials.username);

      if (!user || user.passwordHash !== credentials.password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Generate JWT token for the authenticated user
      const token = createJwt(user);

      // Handle daily bonus assignment for parent users on login
      let dailyBonusAssignments = null;
      if (user.role === 'parent') {
        try {
          console.log(`Parent user ${user.id} (${user.username}) logged in, checking daily bonus assignments`);

          // Get today's date
          const today = new Date().toISOString().split('T')[0];

          // Check if daily bonuses have already been assigned today
          const childUsers = await storage.getUsersByRole('child');
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
            console.log(`All ${childUsers.length} children already have daily bonuses assigned for today`);
          }
          // Otherwise, assign bonuses to all children
          else if (needsAssignment) {
            console.log(`Assigning daily bonuses to children on parent login`);
            dailyBonusAssignments = await storage.assignDailyBonusesToAllChildren(today);
            console.log(`Daily bonus assignment complete:`, dailyBonusAssignments);

            // Broadcast the new assignments to all clients
            for (const [childId, bonus] of Object.entries(dailyBonusAssignments)) {
              if (bonus) {
                broadcast("daily_bonus:assigned", {
                  user_id: parseInt(childId),
                  daily_bonus: bonus
                });
              }
            }
          }
        } catch (error) {
          console.error("Error assigning daily bonuses on parent login:", error);
          // Don't fail the login if bonus assignment fails
        }
      }

      return res.json(
        success({
          token,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
          },
          daily_bonus_assignments: dailyBonusAssignments,
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json(failure("BadRequest", message));
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const newUser = await storage.createUser(userData);
      const token = createJwt(newUser);

      return res
        .status(201)
        .json(
          success({
            token,
            user: {
              id: newUser.id,
              name: newUser.name,
              username: newUser.username,
              role: newUser.role,
            },
          })
        );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json(failure("BadRequest", message));
    }
  });

  // Protected routes middleware
  const auth = AuthMiddleware(storage);
  const parentOnly = AuthMiddleware(storage, "parent");

  // Daily bonus assignment middleware for parent users
  const dailyBonusAssignment = DailyBonusAssignmentMiddleware(storage);

  // Apply daily bonus assignment middleware to parent-only routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Only apply to authenticated parent users
    if (req.user && req.user.role === 'parent') {
      dailyBonusAssignment(req, res, next);
    } else {
      next();
    }
  });

  // Admin route to clean up orphaned products
  app.get("/api/admin/cleanup", parentOnly, async (req: Request, res: Response) => {
    try {
      console.log("Running database cleanup...");
      const result = await cleanupOrphanedProducts();
      return res.json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ message: errorMessage });
    }
  });

  // User routes - public to support automatic family login
  app.get("/api/users", async (req: Request, res: Response) => {
    const usersList = await storage.getUsers(); // Renamed to avoid conflict with schema import

    // Remove passwords from response but include profile image URL
    const sanitizedUsers = usersList.map(user => ({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      profile_image_url: user.profile_image_url,
    }));

    return res.json(sanitizedUsers);
  });

  // Chore routes
  app.get("/api/chores", auth, async (req: Request, res: Response) => {
    const activeOnly = req.query.activeOnly !== "false";
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
      return res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/chores/:id", parentOnly, async (req: Request, res: Response) => {
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
      return res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/chores/:id", parentOnly, async (req: Request, res: Response) => {
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
  });

  // Product routes
  // Get all available products
  app.get("/api/products", auth, async (req: Request, res: Response) => {
    try {
      // Get all products in the system
      const productsList = await storage.getAllProducts(); // Renamed to avoid conflict with schema
      return res.json(success(productsList));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return res.status(500).json(failure("ServerError", errorMessage));
    }
  });



  // Manual product creation endpoint
  app.post("/api/products/manual", auth, async (req: Request, res: Response) => {
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
            const updatedProduct = await storage.updateProduct(existingProduct.id, {
              title: productData.title,
              image_url: productData.image_url || existingProduct.image_url,
              price_cents: productData.price_cents,
              price_locked_cents: productData.price_cents,
            });

            console.log("Updated existing product with new details:", updatedProduct);

            return res.json(
              success({
                ...updatedProduct,
                alreadyExists: true,
                wasUpdated: true,
              })
            );
          }
        } catch (e) {
          console.log("ASIN extraction failed:", e);
          // If ASIN extraction fails, fallback to title matching
        }
      }

      // Only if no exact ASIN match, check if product with exact same title exists
      // Using exactMatch=true to ensure case-insensitive exact title matching
      console.log("Checking for existing product with title:", productData.title);
      const existingProductsByTitle = await storage.getProductsByTitle(productData.title, true);
      console.log("Existing products by title:", existingProductsByTitle);

      // No need for additional filtering as the database query already does the exact matching
      const exactTitleMatch = existingProductsByTitle.length > 0 ? existingProductsByTitle[0] : null;

      if (exactTitleMatch) {
        // Return the exact match
        console.log("Found exact title match:", exactTitleMatch);
        return res.json(
          success({
            ...exactTitleMatch,
            alreadyExists: true,
          })
        );
      }

      // Handle ASIN generation for products without Amazon URL
      let asinGen = ""; // Renamed to avoid conflict
      if (productData.amazonUrl) {
        try {
          asinGen = extractAsin(productData.amazonUrl);
        } catch (e) {
          // Generate a unique ASIN-like ID for non-Amazon products
          asinGen = "MANUAL" + Math.random().toString(36).substring(2, 7).toUpperCase();
        }
      } else {
        // Generate a unique ASIN-like ID for non-Amazon products
        asinGen = "MANUAL" + Math.random().toString(36).substring(2, 7).toUpperCase();
      }
      console.log("Generated ASIN:", asinGen);

      // Create the product with the user-specified title
      const newProduct = {
        title: productData.title,
        asin: asinGen,
        image_url: productData.image_url || "https://placehold.co/400x400?text=No+Image",
        price_cents: productData.price_cents,
        price_locked_cents: productData.price_cents,
      };
      console.log("Creating new product:", newProduct);

      const product = await storage.createProduct(newProduct);
      console.log("Created product:", product);

      return res.status(201).json(success(product));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return res.status(400).json(failure("BadRequest", errorMessage));
    }
  });

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
          price_locked_cents: update.price_cents,
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
    if (user.role !== "parent" && userId && parseInt(userId as string) !== user.id) {
      return res.status(403).json({ message: "Not authorized to view these goals" });
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
          progress: product ? calculateProgressPercent(goal.tickets_saved, product.price_locked_cents) : 0
        };
      })
    );

    return res.json(goalsWithProducts);
  });

  app.get("/api/goals/active", auth, async (req: Request, res: Response) => {
    const { userId } = req.query;
    const user = req.user;

    // Parents can view any user's active goal, children can only view their own
    if (user.role !== "parent" && userId && parseInt(userId as string) !== user.id) {
      return res.status(403).json({ message: "Not authorized to view this goal" });
    }

    const targetUserId = userId ? parseInt(userId as string) : user.id;
    const goal = await storage.getActiveGoalByUser(targetUserId);

    if (!goal) {
      return res.status(404).json({ message: "No active goal found" });
    }

    const progressPercent = calculateProgressPercent(goal.tickets_saved, goal.product.price_locked_cents);

    return res.json({
      ...goal,
      progress: progressPercent
    });
  });

  app.post("/api/goals", auth, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const goalData = insertGoalSchema.parse(req.body);

      // Users can only create goals for themselves
      if (user.role !== "parent" && goalData.user_id !== user.id) {
        return res.status(403).json({ message: "Not authorized to create goals for other users" });
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
        progress: 0
      });

      return res.status(201).json({
        ...newGoal,
        product,
        progress: 0
      });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/goals/:id/activate", auth, async (req: Request, res: Response) => {
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
      return res.status(403).json({ message: "Not authorized to modify this goal" });
    }

    // Let the storage layer handle ticket transfers internally
    // This will automatically find current active goals and transfer tickets
    const updatedGoal = await storage.updateGoal(id, {
      is_active: true
    });
    const product = await storage.getProduct(goal.product_id);

    // Make sure we have valid data before broadcasting
    if (updatedGoal && product) {
      broadcast("goal:update", {
        ...updatedGoal,
        product,
        progress: calculateProgressPercent(updatedGoal.tickets_saved || 0, product.price_locked_cents || 0)
      });

      return res.json({
        ...updatedGoal,
        product,
        progress: calculateProgressPercent(updatedGoal.tickets_saved || 0, product.price_locked_cents || 0)
      });
    } else {
      return res.status(500).json({ message: "Could not update goal" });
    }
  });

  // Delete a goal
  app.delete("/api/goals/:id", auth, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid goal ID" });
    }

    const user = req.user;
    const goal = await storage.getGoal(id);

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    // Only allow users to delete their own goals or parents can delete any goal
    if (user.role !== "parent" && goal.user_id !== user.id) {
      return res.status(403).json({ message: "Not authorized to delete this goal" });
    }

    const productId = goal.product_id;
    const deleted = await storage.deleteGoal(id);

    if (deleted) {
      // Check if there are other goals using this product
      const otherGoalsWithProduct = await storage.getGoalsByProductId(productId);

      // If no other goals are using this product, delete it as well
      if (otherGoalsWithProduct.length === 0) {
        console.log(`No other goals using product ID ${productId}, deleting product`);
        const productDeleted = await storage.deleteProduct(productId);
        console.log(`Product ${productId} deletion result:`, productDeleted);
      }

      // Broadcast the deletion to all connected clients
      broadcast("goal:deleted", { id });
      return res.json({ success: true });
    } else {
      return res.status(500).json({ message: "Failed to delete goal" });
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
      if (user_id && user.role === 'parent') {
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

        console.log(`[FIXED_API] Creating chore completion transaction: user=${user.id}, chore=${chore_id}, tickets=${base_tickets_earned}`);

        // Create transaction directly with raw SQL
        const { rows } = await pool.query(
          `INSERT INTO transactions
           (user_id, chore_id, delta, type, note, source, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [user.id, chore_id, base_tickets_earned, 'earn', noteText, 'chore', now]
        );

        const transaction = rows[0];
        console.log(`[FIXED_API] Created transaction ${transaction.id} with ${base_tickets_earned} tickets`);

        // Check for daily bonus eligibility
        const today = new Date().toISOString().split('T')[0];
        const dailyBonusRecord = await storage.getDailyBonus(today, user.id); // Renamed to avoid conflict

        // Initialize bonus flags
        let bonus_triggered = false;
        let daily_bonus_id = null;

        // Check if this is a bonus-triggering completion
        if (dailyBonusRecord && dailyBonusRecord.assigned_chore_id === chore_id && !dailyBonusRecord.is_spun) {
          console.log(`[FIXED_API] Bonus chore completed! User ${user.id} completed bonus chore ${chore_id}`);
          bonus_triggered = true;
          daily_bonus_id = dailyBonusRecord.id;

          // Mark bonus as triggered for spin
          await pool.query(
            "UPDATE daily_bonus SET trigger_type = 'chore_completion' WHERE id = $1",
            [dailyBonusRecord.id]
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
          daily_bonus_id
        };

        // Broadcast to WebSocket clients
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
            daily_bonus_id
          }
        });

        return res.status(201).json(response);
      } catch (error: any) {
        console.error("[FIXED_API] Error:", error);
        return res.status(500).json({
          message: "Failed to complete chore",
          error: error.message
        });
      }
    } catch (error: any) {
      console.error("[API Error]", error);
      return res.status(400).json({ message: error.message || "Invalid request" });
    }
  });

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
      const { tickets, delta, goal_id, user_id, reason } = req.body;

      // Determine target user - if user_id provided and request is from a parent
      const targetUserId = (user.role === 'parent' && user_id) ? user_id : user.id;

      // Validate that target user exists
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only parents can spend on behalf of children
      if (targetUserId !== user.id && user.role !== 'parent') {
        return res.status(403).json({ message: "Only parents can spend tickets on behalf of children" });
      }

      // Validate input - either tickets/delta or goal_id must be provided
      if (tickets === undefined && delta === undefined && goal_id === undefined) {
        return res.status(400).json({ message: "Either tickets or goal_id must be provided" });
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
          return res.status(403).json({ message: "Not authorized to spend from this goal" });
        }

        ticketsToSpend = targetGoal.tickets_saved;
      } else {
        // Spend a specific number of tickets
        // Accept both 'tickets' and 'delta' fields for backward compatibility
        const ticketInput = tickets !== undefined ? tickets : req.body.delta;
        const ticketValue = typeof ticketInput === 'string' ? parseInt(ticketInput, 10) : ticketInput;
        ticketsToSpend = Math.min(ticketValue, currentBalance);

        if (isNaN(ticketsToSpend) || ticketsToSpend <= 0) {
          return res.status(400).json({ message: "Invalid number of tickets to spend" });
        }

        if (ticketsToSpend > currentBalance) {
          return res.status(400).json({ message: "Not enough tickets available" });
        }
      }

      // Create transaction - this will handle setting tickets_saved to 0 when type is 'spend'
      const transaction = await storage.createTransaction({
        user_id: targetUserId,
        goal_id: targetGoal?.id,
        delta: -ticketsToSpend,
        type: "spend",
        note: reason ? `Purchase: ${reason}` : "Purchase"
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
        goal: targetGoal
      };

      // Broadcast transaction with balance for real-time UI updates
      broadcast("transaction:spend", {
        data: {
          id: transaction.id,
          delta: transaction.delta,
          note: transaction.note,
          user_id: targetUserId,
          type: transaction.type,
          balance: updatedBalance
        }
      });

      return res.status(201).json(response);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });

  // Add a bad behavior deduction (parent only)
  app.post("/api/bad-behavior", parentOnly, async (req: Request, res: Response) => {
    try {
      const data = badBehaviorSchema.parse(req.body);

      // Make sure the user exists
      const targetUser = await storage.getUser(data.user_id);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only allow deducting tickets from children
      if (targetUser.role !== 'child') {
        return res.status(400).json({ message: "Can only deduct tickets from child accounts" });
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
        type: 'deduct',
        note: data.reason ? `Deduction: ${data.reason}` : 'Ticket deduction for bad behavior',
        source: 'manual_deduct'
      });

      // Return the transaction and updated balance
      const response = {
        transaction,
        reason: data.reason,
        balance: await storage.getUserBalance(data.user_id),
        goal: activeGoal
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
          balance: updatedBalance // Include balance for immediate UI updates
        }
      });

      return res.status(201).json(response);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });

  // Add a good behavior reward (parent only)
  app.post("/api/good-behavior", parentOnly, async (req: Request, res: Response) => {
    try {
      const data = goodBehaviorSchema.parse(req.body);
      const userId = parseInt(data.user_id);

      // Make sure the user exists
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only allow adding tickets to children
      if (targetUser.role !== 'child') {
        return res.status(400).json({ message: "Can only add bonus tickets to child accounts" });
      }

      // Get the active goal for this user
      const activeGoal = await storage.getActiveGoalByUser(userId);

      // Create a daily bonus for good behavior
      const today = new Date().toISOString().split('T')[0];

      let dailyBonusRecord;
      let transaction;
      let updatedBalance;

      // Handle based on reward type
      if (data.rewardType === 'spin') {
        // For bonus spin, create a new daily bonus record without adding tickets yet
        console.log(`[GOOD_BEHAVIOR] Creating bonus spin for user ${userId}`);

        try {
          // Always check first if they already have a good behavior reward today
          const existingGoodBehaviorBonus = await storage.getDailyBonusByTriggerType(
            userId, today, 'good_behavior_reward');

          if (existingGoodBehaviorBonus) {
            console.log(`[GOOD_BEHAVIOR] User already has a good behavior bonus for today`);

            if (!existingGoodBehaviorBonus.is_spun) {
              // If it exists but hasn't been spun, just return it
              console.log(`[GOOD_BEHAVIOR] Existing bonus hasn't been spun yet, returning it`);
              return res.status(200).json({
                message: "This child already has a pending good behavior bonus spin",
                daily_bonus: existingGoodBehaviorBonus
              });
            } else {
              // If it has been spun, delete it so we can create a new one
              console.log(`[GOOD_BEHAVIOR] Deleting previously spun good behavior bonus`);
              await storage.deleteDailyBonusById(userId, existingGoodBehaviorBonus.id);
            }
          }

          // Instead of checking for conflicts with chore completion bonuses,
          // we now allow both types to coexist, since they serve different purposes
          console.log(`[GOOD_BEHAVIOR] Keeping any existing chore completion bonus - both can coexist`);

          // We're no longer deleting chore completion bonuses when creating good behavior bonuses

          // Now create the good behavior bonus
          dailyBonusRecord = await storage.createDailyBonus({
            bonus_date: today,
            user_id: userId,
            assigned_chore_id: null, // No specific chore for good behavior
            is_override: true,
            is_spun: false,
            trigger_type: 'good_behavior_reward',
            spin_result_tickets: null // Will be set when spun
          });

          console.log(`[GOOD_BEHAVIOR] Successfully created good behavior bonus:`, {
            id: dailyBonusRecord.id,
            user_id: dailyBonusRecord.user_id,
            trigger_type: dailyBonusRecord.trigger_type
          });

          // Create a placeholder transaction to acknowledge the spin opportunity
          transaction = await storage.createTransaction({
            user_id: userId,
            chore_id: null,
            goal_id: activeGoal?.id || null,
            delta: 0, // No tickets yet, will be updated after spin
            type: 'reward',
            note: `Good Behavior: ${data.reason || 'No reason provided'}`,
            source: 'bonus_spin',
            ref_id: dailyBonusRecord.id, // Reference the bonus record
            reason: data.reason || 'Good behavior'
          });

          console.log(`[GOOD_BEHAVIOR] Created placeholder transaction:`, {
            id: transaction.id,
            user_id: transaction.user_id,
            delta: transaction.delta
          });

          // Broadcast notification about the good behavior bonus
          broadcast("daily_bonus:good_behavior", {
            user_id: userId,
            daily_bonus: dailyBonusRecord
          });
        } catch (error: any) {
          console.error(`[GOOD_BEHAVIOR] Error creating bonus spin:`, error);
          return res.status(400).json({
            message: error instanceof Error ? error.message : 'Failed to create bonus spin'
          });
        }

        // Get the updated balance
        updatedBalance = await storage.getUserBalance(userId);

      } else if (data.rewardType === 'tickets' && data.tickets) {
        // For direct ticket rewards, add the tickets immediately
        console.log(`[GOOD_BEHAVIOR] Adding ${data.tickets} tickets for user ${userId}`);

        // Create transaction for the direct ticket reward
        transaction = await storage.createTransaction({
          user_id: userId,
          chore_id: null,
          goal_id: activeGoal?.id || null,
          delta: parseInt(data.tickets.toString()),
          type: 'reward',
          note: `Good Behavior: ${data.reason || 'No reason provided'}`,
          source: 'manual_add',
          ref_id: null // No daily bonus reference for direct rewards
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
            balance: updatedBalance
          }
        });
      } else {
        // Invalid or missing reward type
        return res.status(400).json({
          message: "Must provide valid rewardType ('tickets' or 'spin') and appropriate parameters"
        });
      }

      // Build response
      const response = {
        transaction,
        daily_bonus: dailyBonusRecord,
        reason: data.reason,
        balance: updatedBalance,
        goal: activeGoal
      };

      return res.status(201).json(response);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });

  // Get daily bonus assignments for specific date - parent only
  app.get("/api/daily-bonus/assignments", parentOnly, async (req: Request, res: Response) => {
    try {
      // Get the date from query parameters, default to today
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      console.log(`[BONUS_ASSIGNMENTS] Fetching assignments for date: ${date}`);

      // Get all child users
      const childUsers = await storage.getUsersByRole('child');
      console.log(`[BONUS_ASSIGNMENTS] Found ${childUsers.length} child users`);

      if (!childUsers.length) {
        console.log(`[BONUS_ASSIGNMENTS] No child users found, returning 404`);
        return res.status(404).json({ message: "No child users found" });
      }

      // Build an object with child_id -> assignment information
      const assignmentsResult: Record<string, any> = {}; // Change to string keys for client compatibility

      // For each child, get their daily bonus assignment (if any)
      for (const child of childUsers) {
        console.log(`[BONUS_ASSIGNMENTS] Checking bonus for child: ${child.id} (${child.name})`);
        const bonusRecord = await storage.getDailyBonus(date, child.id);
        console.log(`[BONUS_ASSIGNMENTS] Bonus record for child ${child.id}:`, bonusRecord || 'No bonus found');

        if (bonusRecord) {
          let assignedChore = null;
          if (bonusRecord.assigned_chore_id) {
            assignedChore = await storage.getChore(bonusRecord.assigned_chore_id);
            console.log(`[BONUS_ASSIGNMENTS] Found assigned chore:`, assignedChore?.name || 'No chore found');
          }

          assignmentsResult[child.id.toString()] = { // Convert id to string
            user: {
              id: child.id,
              name: child.name,
              username: child.username
            },
            bonus: bonusRecord,
            assigned_chore: assignedChore
          };
        } else {
          assignmentsResult[child.id.toString()] = { // Convert id to string
            user: {
              id: child.id,
              name: child.name,
              username: child.username
            },
            bonus: null,
            assigned_chore: null
          };
        }
      }

      console.log(`[BONUS_ASSIGNMENTS] Returning assignment data for ${Object.keys(assignmentsResult).length} children`);
      console.log(`[BONUS_ASSIGNMENTS] Data structure:`, {
        isObject: true,
        keys: Object.keys(assignmentsResult),
        exampleKey: Object.keys(assignmentsResult)[0] || 'none',
        keyTypes: Object.keys(assignmentsResult).map(k => typeof k).join(', ')
      });

      return res.status(200).json(assignmentsResult);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });

  // Check for an unspun daily bonus for a specific user
  // Returns bonus info only if prerequisites are met based on trigger type
  app.get("/api/daily-bonus/unspun", auth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.user_id as string);

      if (!userId || isNaN(userId)) {
        console.log("[UNSPUN_BONUS] Missing or invalid user_id:", req.query.user_id);
        return res.status(400).json({ message: "Missing or invalid user_id parameter" });
      }

      console.log("[UNSPUN_BONUS] Checking for unspun bonus for user:", userId);

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // First check for good_behavior_reward bonuses
      const goodBehaviorBonus = await storage.getDailyBonusByTriggerType(userId, today, 'good_behavior_reward');

      // If there's an unspun good behavior bonus, return it immediately
      if (goodBehaviorBonus && !goodBehaviorBonus.is_spun) {
        console.log("[UNSPUN_BONUS] Found unspun good behavior bonus:", goodBehaviorBonus.id);

        // For good behavior bonuses, return immediately - no prerequisites
        return res.status(200).json({
          daily_bonus_id: goodBehaviorBonus.id,
          chore_name: "Good Behavior",
          trigger_type: 'good_behavior_reward'
        });
      }

      // Now check for a chore completion bonus specifically
      const choreBonus = await storage.getDailyBonusByTriggerType(userId, today, 'chore_completion');

      // No chore bonus found
      if (!choreBonus) {
        console.log("[UNSPUN_BONUS] No chore completion bonus found for user", userId, "on date", today);
        return res.status(404).json({ message: "No daily bonus found for this user and date" });
      }

      // Chore bonus exists but already spun
      if (choreBonus.is_spun) {
        console.log("[UNSPUN_BONUS] Chore completion bonus already spun for user", userId, "on date", today);
        return res.status(404).json({ message: "Daily bonus has already been spun" });
      }

      // For chore completion bonuses, check if the chore has actually been completed
      if (choreBonus.trigger_type === 'chore_completion' && choreBonus.assigned_chore_id !== null) {
        // Get today's transactions to see if the assigned chore was completed
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);

        const recentTransactions = await storage.getUserTransactions(userId, 50);
        const completedChoreIds = new Set();

        // Find which chores were completed today
        for (const tx of recentTransactions) {
          if (tx.type === 'earn' && tx.chore_id && tx.created_at) {
            const txDate = new Date(tx.created_at);
            if (txDate >= todayDate) {
              completedChoreIds.add(tx.chore_id);
            }
          }
        }

        console.log("[UNSPUN_BONUS] Checking if chore was completed - Assigned chore:", choreBonus.assigned_chore_id);
        console.log("[UNSPUN_BONUS] Completed chores today:", Array.from(completedChoreIds));

        // If the assigned chore wasn't completed, don't show the bonus yet
        if (!completedChoreIds.has(choreBonus.assigned_chore_id)) {
          console.log("[UNSPUN_BONUS] Assigned chore has not been completed yet");
          return res.status(404).json({
            message: "Daily bonus chore has not been completed yet"
          });
        }
      }

      // If we have an unspun bonus and prerequisites are met, get more details
      let bonusDetails: any = {
        daily_bonus_id: choreBonus.id,
        trigger_type: choreBonus.trigger_type
      };

      if (choreBonus.trigger_type === 'chore_completion' && choreBonus.assigned_chore_id) {
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
      return res.status(500).json({ message: "Error checking for unspun daily bonus" });
    }
  });

  app.put("/api/daily-bonus/assign", parentOnly, async (req: Request, res: Response) => {
    try {
      const { user_id, chore_id, date } = req.body;

      if (!user_id || !chore_id) {
        return res.status(400).json({ message: "user_id and chore_id are required" });
      }

      // Default to today if date not provided
      const assignDate = date || new Date().toISOString().split('T')[0];

      // Verify the user exists and is a child
      const targetUser = await storage.getUser(user_id);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (targetUser.role !== 'child') {
        return res.status(400).json({ message: "Can only assign bonus to child accounts" });
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
            message: "Cannot change bonus assignment after wheel has been spun"
          });
        }

        // Update the existing record using a direct SQL query
        await pool.query(
          "UPDATE daily_bonus SET assigned_chore_id = $1, is_override = true WHERE id = $2",
          [chore_id, dailyBonusRecord.id]
        );

        // Get the updated record
        dailyBonusRecord = await storage.getDailyBonusById(dailyBonusRecord.id);
      } else {
        // Create a new daily bonus record with override flag
        dailyBonusRecord = await storage.createDailyBonus({
          bonus_date: assignDate,
          user_id: user_id,
          assigned_chore_id: chore_id,
          is_override: true, // Mark this as a manual override
          is_spun: false,
          trigger_type: 'chore_completion',
          spin_result_tickets: 0 // Default value until wheel is spun
        });
      }

      // Update the chore's last_bonus_assigned date
      await pool.query(
        "UPDATE chores SET last_bonus_assigned = $1 WHERE id = $2",
        [assignDate, chore_id]
      );

      // Broadcast the new assignment
      broadcast("daily_bonus:assigned", {
        user_id,
        daily_bonus: dailyBonusRecord
      });

      return res.status(200).json({
        success: true,
        daily_bonus: dailyBonusRecord,
        chore
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });

  // Reset daily bonus for a child - parent only
  app.post("/api/reset-daily-bonus", parentOnly, async (req: Request, res: Response) => {
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
        return res.status(400).json({ message: "Daily bonus can only be reset for children" });
      }

      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Get the current daily bonus for debugging
      const currentBonus = await storage.getDailyBonus(today, parseInt(user_id));
      console.log(`Current daily bonus before reset for user ${user_id}:`, currentBonus);

      // Delete the bonus for today
      await storage.deleteDailyBonus(parseInt(user_id));

      // Create a new daily bonus assignment
      let newAssignment = await storage.assignDailyBonusChore(parseInt(user_id), today);
      console.log(`New daily bonus assigned for user ${user_id}:`, newAssignment);

      // BUGFIX: If no assignment was created due to cooldown/eligibility issues,
      // create one manually for debugging purposes
      if (!newAssignment && process.env.NODE_ENV === 'development') {
        console.log(`[BONUS_RESET] No automatic assignment created. Creating a manual one for debugging.`);

        // Get the first daily chore regardless of cooldown
        const allChores = await storage.getChores(true);
        const dailyChores = allChores.filter(c => c.recurrence === 'daily');

        if (dailyChores.length > 0) {
          const selectedChore = dailyChores[0];
          console.log(`[BONUS_RESET] Selected chore ${selectedChore.id} (${selectedChore.name}) for manual assignment`);

          // Create manual daily bonus
          newAssignment = await storage.createDailyBonus({
            bonus_date: today,
            user_id: parseInt(user_id),
            assigned_chore_id: selectedChore.id,
            is_override: true, // Mark this as a manual override
            is_spun: false,    // Make sure it's not marked as spun
            trigger_type: 'chore_completion',
            spin_result_tickets: 0
          });

          console.log(`[BONUS_RESET] Created manual bonus assignment:`, newAssignment);
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
          chore: assignedChore
        });
      }

      return res.status(200).json({
        success: true,
        message: "Daily bonus has been reset and reassigned",
        assignment: newAssignment
      });
    } catch (error) {
      console.error("Error resetting daily bonus:", error);
      return res.status(500).json({ message: "Failed to reset daily bonus" });
    }
  });

  // Assign daily bonus chores to all children - parent only
  app.post("/api/assign-daily-bonuses", parentOnly, async (req: Request, res: Response) => {
    try {
      // Use today's date by default, or a date provided in the request
      const date = req.body.date || new Date().toISOString().split('T')[0];

      // Assign bonus chores to all children
      const results = await storage.assignDailyBonusesToAllChildren(date);

      // Count successful assignments
      const successCount = Object.values(results).filter(bonus => bonus !== null).length;

      // If any bonuses were assigned, broadcast an event
      if (successCount > 0) {
        broadcast("daily_bonus:assigned", {
          date,
          count: successCount,
          results
        });
      }

      return res.status(200).json({
        success: true,
        message: `Assigned daily bonus chores to ${successCount} children`,
        results
      });
    } catch (error) {
      console.error("Error assigning daily bonuses:", error);
      return res.status(500).json({ message: "Failed to assign daily bonuses" });
    }
  });

  // Assign a daily bonus chore to a specific child - parent only
  app.post("/api/assign-daily-bonus", parentOnly, async (req: Request, res: Response) => {
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
        return res.status(400).json({ message: "Daily bonus can only be assigned to children" });
      }

      // Use today's date by default, or the date provided
      const bonusDate = date || new Date().toISOString().split('T')[0];

      // Check if chore_id was provided - if so, use that specific chore instead of random assignment
      let dailyBonusRecord; // Renamed

      if (chore_id) {
        console.log(`[ASSIGN_BONUS] Specific chore ID ${chore_id} provided - using this instead of random assignment`);

        // Verify the chore exists
        const chore = await storage.getChore(parseInt(chore_id));
        if (!chore) {
          return res.status(404).json({ message: `Chore with ID ${chore_id} not found` });
        }

        // Check if there's already a daily bonus for this user/date
        const existingBonus = await storage.getDailyBonus(bonusDate, parseInt(user_id));

        if (existingBonus) {
          // If already spun, don't allow changing the assignment
          if (existingBonus.is_spun) {
            return res.status(400).json({
              message: "Cannot change bonus assignment after wheel has been spun"
            });
          }

          console.log(`[ASSIGN_BONUS] Updating existing bonus ID ${existingBonus.id} with new chore ID ${chore_id}`);

          // Update the existing record
          await pool.query(
            "UPDATE daily_bonus SET assigned_chore_id = $1, is_override = true WHERE id = $2",
            [parseInt(chore_id), existingBonus.id]
          );

          // Get the updated record
          dailyBonusRecord = await storage.getDailyBonusById(existingBonus.id);
        } else {
          // Create a new daily bonus record with the specified chore
          dailyBonusRecord = await storage.createDailyBonus({
            bonus_date: bonusDate,
            user_id: parseInt(user_id),
            assigned_chore_id: parseInt(chore_id),
            is_override: true, // Mark this as a manual override
            is_spun: false,
            trigger_type: 'chore_completion',
            spin_result_tickets: 0 // Default value until wheel is spun
          });
        }

        // Update the chore's last_bonus_assigned date
        await pool.query(
          "UPDATE chores SET last_bonus_assigned = $1 WHERE id = $2",
          [bonusDate, parseInt(chore_id)]
        );
      } else {
        // No chore_id provided, assign a random bonus chore
        dailyBonusRecord = await storage.assignDailyBonusChore(parseInt(user_id), bonusDate);
      }

      // BUGFIX: For debugging purposes, if no eligible chores found, create a manual assignment
      if (!dailyBonusRecord && process.env.NODE_ENV === 'development') {
        console.log(`[ASSIGN_BONUS] No automatic assignment created. Creating a manual one for debugging.`);

        // Get all active chores for this user
        const allChores = await storage.getChores(true);
        const dailyChores = allChores.filter(c => c.recurrence === 'daily');

        if (dailyChores.length > 0) {
          const selectedChore = dailyChores[0];
          console.log(`[ASSIGN_BONUS] Selected chore ${selectedChore.id} (${selectedChore.name}) for manual assignment`);

          // Create manual daily bonus
          dailyBonusRecord = await storage.createDailyBonus({
            bonus_date: bonusDate,
            user_id: parseInt(user_id),
            assigned_chore_id: selectedChore.id,
            is_override: true, // Mark this as a manual override
            is_spun: false,    // Make sure it's not marked as spun
            trigger_type: 'chore_completion',
            spin_result_tickets: 0
          });

          console.log(`[ASSIGN_BONUS] Created manual bonus assignment:`, dailyBonusRecord);

          // Update the chore's last_bonus_assigned date
          await pool.query(
            "UPDATE chores SET last_bonus_assigned = $1 WHERE id = $2",
            [bonusDate, selectedChore.id]
          );
        }
      }

      if (!dailyBonusRecord) {
        return res.status(400).json({
          success: false,
          message: "Could not assign a bonus chore. No eligible chores found."
        });
      }

      // Get the assigned chore details
      const chore = dailyBonusRecord.assigned_chore_id ?
        await storage.getChore(dailyBonusRecord.assigned_chore_id) :
        null;

      // Broadcast that a bonus has been assigned
      broadcast("daily_bonus:assigned", {
        user_id: parseInt(user_id),
        daily_bonus: dailyBonusRecord,
        chore
      });

      return res.status(200).json({
        success: true,
        message: "Daily bonus chore has been assigned",
        daily_bonus: dailyBonusRecord,
        chore
      });
    } catch (error) {
      console.error("Error assigning daily bonus:", error);
      return res.status(500).json({ message: "Failed to assign daily bonus" });
    }
  });

  // Endpoint for spinning the bonus wheel for a daily bonus
  app.post("/api/bonus-spin", auth, async (req: Request, res: Response) => {
    try {
      console.log(`[BONUS_SPIN] Processing spin request:`, req.body);

      const data = bonusSpinSchema.parse(req.body);
      console.log(`[BONUS_SPIN] Validated request data:`, data);

      // Step 1: Get the daily bonus record
      const dailyBonusRecord = await storage.getDailyBonusById(data.daily_bonus_id);

      console.log(`[BONUS_SPIN] Daily bonus record lookup:`, dailyBonusRecord ? {
        id: dailyBonusRecord.id,
        user_id: dailyBonusRecord.user_id,
        assigned_chore_id: dailyBonusRecord.assigned_chore_id,
        is_spun: dailyBonusRecord.is_spun,
        trigger_type: dailyBonusRecord.trigger_type,
        bonus_date: dailyBonusRecord.bonus_date
      } : 'Record not found');

      if (!dailyBonusRecord) {
        console.log(`[BONUS_SPIN] ERROR: Daily bonus record ${data.daily_bonus_id} not found`);
        return res.status(404).json({ message: "Daily bonus record not found" });
      }

      // Step 2: Verify the requesting user is either the bonus owner or a parent
      const requestingUser = req.user;
      console.log(`[BONUS_SPIN] Authorizing request from user ${requestingUser.id} (${requestingUser.role}) for bonus belonging to user ${dailyBonusRecord.user_id}`);

      if (
        requestingUser.id !== dailyBonusRecord.user_id &&
        requestingUser.role !== "parent"
      ) {
        console.log(`[BONUS_SPIN] ERROR: Authorization failed - requester is not owner or parent`);
        return res.status(403).json({
          message: "You do not have permission to spin this bonus wheel"
        });
      }

      // Step 3: Check if the bonus has already been spun
      if (dailyBonusRecord.is_spun) {
        console.log(`[BONUS_SPIN] ERROR: Bonus ${dailyBonusRecord.id} has already been spun`);
        return res.status(400).json({
          message: "This bonus wheel has already been spun",
          daily_bonus: dailyBonusRecord
        });
      }

      // Step 4: Get the associated chore information if this is a chore completion bonus
      let chore = null;
      if (dailyBonusRecord.assigned_chore_id) {
        console.log(`[BONUS_SPIN] Looking up associated chore ${dailyBonusRecord.assigned_chore_id}`);
        chore = await storage.getChore(dailyBonusRecord.assigned_chore_id);

        console.log(`[BONUS_SPIN] Associated chore lookup result:`, chore ? {
          id: chore.id,
          name: chore.name,
          base_tickets: chore.base_tickets,
          recurrence: chore.recurrence
        } : 'Chore not found');

        if (!chore) {
          console.log(`[BONUS_SPIN] ERROR: Associated chore ${dailyBonusRecord.assigned_chore_id} not found`);
          return res.status(404).json({ message: "Associated chore not found" });
        }
      }

      // Step 5: Perform a weighted random spin
      console.log(`[BONUS_SPIN] Starting random wheel spin process for bonus ${dailyBonusRecord.id}`);

      // Using the wheel segments from the frontend config
      const WHEEL_SEGMENTS = [
        { value: 1, weight: 20, label: "1" },   // 20% chance
        { value: 2, weight: 18, label: "2" },   // 18% chance
        { value: 3, weight: 16, label: "3" },   // 16% chance
        { value: 5, weight: 13, label: "5" },   // 13% chance
        { value: 2, weight: 14, label: "2" },   // 14% chance (duplicate for UX)
        { value: 10, weight: 7, label: "10" },  // 7% chance
        { type: "double", weight: 5, label: "×2", value: "double", multiplier: 2 }, // 5% chance
        { value: 4, weight: 7, label: "4" },    // 7% chance
        { value: "respin", weight: 5, label: "Spin Again" }  // 5% chance
      ];

      // Calculate total weight
      const totalWeight = WHEEL_SEGMENTS.reduce((sum, segment) => sum + segment.weight, 0);

      // Generate a random number between 0 and totalWeight
      const random = Math.random() * totalWeight;
      console.log(`[BONUS_SPIN] Generated random value: ${random} (total weight: ${totalWeight})`);

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

      console.log(`[BONUS_SPIN] Selected wheel segment: ${selectedSegment.label} (value: ${selectedSegment.value}) at index ${selectedIndex}`);


      // Step 6: Calculate bonus tickets based on the spin result
      let bonusTickets = 0;
      let respin = false;
      let segmentLabel = selectedSegment.label;

      console.log(`[BONUS_SPIN] Calculating bonus tickets for segment type: ${selectedSegment.value}`);

      if (selectedSegment.value === "respin") {
        // First check if this is already a respin attempt
        if (dailyBonusRecord.trigger_type === "respin") {
          // Convert respin to +1 ticket if this is a second respin
          bonusTickets = 1;
          segmentLabel = "1 (converted from Spin Again)";
          console.log(`[BONUS_SPIN] Already a respin attempt, converting to 1 ticket`);
        } else {
          // Mark for respin
          respin = true;
          bonusTickets = 0;
          console.log(`[BONUS_SPIN] First respin attempt, will set trigger_type='respin'`);
        }
      } else if (selectedSegment.value === "double") {
        // For "×2 Multiplier" - double the original tickets from the chore
        if (dailyBonusRecord.trigger_type === "chore_completion" && chore) {
          // Double the base tickets up to a max of 10 tickets total
          const baseTickets = chore.base_tickets;
          bonusTickets = Math.min(baseTickets * 2, 10);
          // Show the multiplier in the result for clarity
          segmentLabel = `×2 (${bonusTickets} tickets)`;
          console.log(`[BONUS_SPIN] ×2 Multiplier: ${baseTickets} × 2 = ${bonusTickets} tickets`);
        } else {
          // For good behavior rewards, award a fixed prize (4 tickets)
          bonusTickets = 4;
          segmentLabel = "4 (×2 Multiplier)";
          console.log(`[BONUS_SPIN] ×2 Multiplier for non-chore completion, awarding 4 tickets`);
        }
      } else {
        // For direct ticket amounts (1, 2, 3, 5, 10)
        bonusTickets = Number(selectedSegment.value);
        console.log(`[BONUS_SPIN] Direct ticket award: ${bonusTickets} tickets`);
      }

      // Step 7: Update the dailyBonus record
      console.log(`[BONUS_SPIN] Updating daily bonus record ${dailyBonusRecord.id}:`, {
        respin,
        bonusTickets,
        segmentLabel,
        trigger_type: respin ? 'respin' : dailyBonusRecord.trigger_type,
        is_spun: !respin
      });

      let updatedBonus;

      if (respin) {
        // For "Spin Again", update trigger_type but don't mark as spun yet
        const result = await db
          .update(dailyBonus)
          .set({
            trigger_type: 'respin'
          })
          .where(eq(dailyBonus.id, dailyBonusRecord.id))
          .returning();

        updatedBonus = result[0];
        console.log(`[BONUS_SPIN] Set respin flag - daily bonus will remain active for another spin`);
      } else {
        // For all other outcomes, mark as spun and set the result
        const result = await db
          .update(dailyBonus)
          .set({
            is_spun: true,
            spin_result_tickets: bonusTickets
          })
          .where(eq(dailyBonus.id, dailyBonusRecord.id))
          .returning();

        updatedBonus = result[0];
        console.log(`[BONUS_SPIN] Final spin outcome - marked daily bonus as spun with ${bonusTickets} tickets`);
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
          ref_id: dailyBonusRecord.id
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
            balance: balance
          }
        });
      }

      // Step 11: Broadcast the spin result
      broadcast("bonus_spin:result", {
        daily_bonus_id: dailyBonusRecord.id,
        user_id: dailyBonusRecord.user_id,
        segment_index: selectedIndex,
        tickets_awarded: bonusTickets,
        segment_label: segmentLabel,
        respin_allowed: respin
      });

      // Step 12: Return success response
      return res.status(200).json({
        success: true,
        daily_bonus: updatedBonus,
        segment_index: selectedIndex,
        segment_label: segmentLabel,
        tickets_awarded: bonusTickets,
        respin_allowed: respin,
        chore: chore
      });
    } catch (error: any) {
      console.error("Error processing bonus spin:", error);
      return res.status(400).json({ message: error.message || "Failed to process bonus spin" });
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
  app.post("/api/spin-wheel", parentOnly, async (req: Request, res: Response) => {
    try {
      const data = spinWheelSchema.parse(req.body);

      // Verify both child and chore exist
      const [targetUser, chore] = await Promise.all([
        storage.getUser(data.user_id),
        storage.getChore(data.assigned_chore_id)
      ]);

      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (targetUser.role !== "child") {
        return res.status(400).json({ message: "Daily bonus can only be assigned to children" });
      }

      if (!chore) {
        return res.status(404).json({ message: "Chore not found" });
      }

      // Check if child already has a bonus today
      const today = new Date().toISOString().split('T')[0];
      const existingBonus = await storage.getDailyBonus(today, data.user_id);

      let dailyBonusRecord; // Renamed

      if (existingBonus) {
        if (existingBonus.is_spun) {
          return res.status(400).json({
            message: "Child has already spun the wheel for today's bonus",
            daily_bonus: existingBonus
          });
        }

        // Calculate random bonus tickets (50-100% extra)
        const bonusMultiplier = 0.5 + (Math.random() * 0.5);
        const bonusTickets = Math.ceil(chore.base_tickets * bonusMultiplier);

        // Update the existing daily bonus with spin results
        const [updatedBonus] = await db
          .update(dailyBonus) // Use the schema import
          .set({
            is_spun: true,
            spin_result_tickets: bonusTickets
          })
          .where(eq(dailyBonus.id, existingBonus.id))
          .returning();

        dailyBonusRecord = updatedBonus;
      } else {
        // Calculate random bonus tickets (50-100% extra)
        const bonusMultiplier = 0.5 + (Math.random() * 0.5);
        const bonusTickets = Math.ceil(chore.base_tickets * bonusMultiplier);

        // Create a new daily bonus
        dailyBonusRecord = await storage.createDailyBonus({
          bonus_date: today,
          user_id: data.user_id,
          assigned_chore_id: data.assigned_chore_id,
          is_override: true,
          is_spun: true,
          trigger_type: 'good_behavior_reward',
          spin_result_tickets: bonusTickets
        });
      }

      // Broadcast the spin results
      broadcast("daily_bonus:spin", {
        daily_bonus: dailyBonusRecord,
        chore: chore,
        spin_result_tickets: dailyBonusRecord.spin_result_tickets,
        user_id: data.user_id
      });

      // Return success with the daily bonus details
      return res.status(200).json({
        success: true,
        message: "Wheel has been spun for daily bonus",
        daily_bonus: dailyBonusRecord,
        chore: chore,
        spin_result_tickets: dailyBonusRecord.spin_result_tickets
      });
    } catch (error) {
      console.error("Error spinning wheel for daily bonus:", error);
      return res.status(500).json({ message: "Failed to spin wheel for daily bonus" });
    }
  });

  app.get("/api/transactions", auth, async (req: Request, res: Response) => {
    const { userId, limit } = req.query;
    const user = req.user;

    // Parents can view any user's transactions, children can only view their own
    if (user.role !== "parent" && userId && parseInt(userId as string) !== user.id) {
      return res.status(403).json({ message: "Not authorized to view these transactions" });
    }

    const targetUserId = userId ? parseInt(userId as string) : user.id;
    const limitNum = limit ? parseInt(limit as string) : 10;

    const transactions = await storage.getUserTransactionsWithDetails(targetUserId, limitNum);

    return res.json(transactions);
  });

  app.delete("/api/transactions/:id", auth, async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user;

    // Get the transaction first to verify ownership
    const transaction = await storage.getTransaction(parseInt(id));

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Only parents or the user who owns the transaction can delete it
    if (user.role !== "parent" && transaction.user_id !== user.id) {
      return res.status(403).json({ message: "Not authorized to delete this transaction" });
    }

    // Delete the transaction
    const deleted = await storage.deleteTransaction(parseInt(id));

    if (!deleted) {
      return res.status(500).json({ message: "Failed to delete transaction" });
    }

    // Get updated balance
    const balance = await storage.getUserBalance(transaction.user_id);

    // Always get the updated active goal when a transaction is deleted,
    // regardless of transaction type, since the balance has changed
    let goal = await storage.getActiveGoalByUser(transaction.user_id);

    // If we don't have an active goal but the transaction was tied to a specific goal,
    // include that one instead
    if (!goal && transaction.goal_id) {
      goal = await storage.getGoalWithProduct(transaction.goal_id);
    }

    // Force a refresh of the goal progress to match the current balance
    if (goal) {
      console.log(`[DELETE] Updating goal progress for user ${transaction.user_id} after transaction deletion`);
      // Get current balance
      const userBalance = await storage.getUserBalance(transaction.user_id);

      // Calculate the max tickets for this goal
      const maxGoalTickets = Math.ceil(goal.product.price_locked_cents / TICKET_CENT_VALUE);

      // Update the goal progress to match the current balance (up to the max tickets needed)
      const newGoalProgress = Math.min(userBalance, maxGoalTickets);

      console.log(`[DELETE] Updating goal ${goal.id} progress from ${goal.tickets_saved} to ${newGoalProgress} (balance: ${userBalance}, max: ${maxGoalTickets})`);

      // Update the goal in the database
      await storage.updateGoal(goal.id, { tickets_saved: newGoalProgress });

      // Get updated goal with new progress
      goal = await storage.getActiveGoalByUser(transaction.user_id);
    }

    // Broadcast the deletion
    broadcast("transaction:delete", {
      transaction_id: parseInt(id),
      user_id: transaction.user_id,
      balance,
      goal
    });

    return res.json({
      message: "Transaction deleted successfully",
      transaction_id: parseInt(id),
      balance,
      goal
    });
  });

  app.get("/api/stats", auth, async (req: Request, res: Response) => {
    const { userId } = req.query;
    const user = req.user;

    // Parents can view any user's stats, children can only view their own
    if (user.role !== "parent" && userId && parseInt(userId as string) !== user.id) {
      return res.status(403).json({ message: "Not authorized to view these stats" });
    }

    const targetUserId = userId ? parseInt(userId as string) : user.id;

    // Get balance
    const balance = await storage.getUserBalance(targetUserId);

    // Get active goal with progress
    let activeGoal = await storage.getActiveGoalByUser(targetUserId);
    let progressPercent = 0;
    let estimatedCompletion = null;

    if (activeGoal) {
      // Make sure the goal's tickets_saved value is synced with the current balance
      // This ensures the UI always shows consistent data even if somehow they got out of sync
      if (balance !== activeGoal.tickets_saved) {
        console.log(`[STATS] Fixing goal progress for user ${targetUserId}: balance=${balance}, goal.tickets_saved=${activeGoal.tickets_saved}`);

        // Calculate max tickets needed for this goal
        const maxTickets = Math.ceil(activeGoal.product.price_locked_cents / TICKET_CENT_VALUE);

        // Update the goal to match the balance (up to the max needed)
        const newProgress = Math.min(balance, maxTickets);

        if (newProgress !== activeGoal.tickets_saved) {
          console.log(`[STATS] Updating goal ${activeGoal.id} tickets_saved from ${activeGoal.tickets_saved} to ${newProgress}`);
          await storage.updateGoal(activeGoal.id, { tickets_saved: newProgress });

          // Get the updated goal
          activeGoal = await storage.getActiveGoalByUser(targetUserId);
        }
      }

      progressPercent = calculateProgressPercent(activeGoal.tickets_saved, activeGoal.product.price_locked_cents);

      // Calculate estimated completion
      const transactions = await storage.getUserTransactions(targetUserId, 10);
      const earnTransactions = transactions.filter(tx => tx.type === 'earn');

      if (earnTransactions.length > 0) {
        // Calculate average tickets earned per day
        const totalEarned = earnTransactions.reduce((sum, tx) => sum + tx.delta, 0);
        const avgPerDay = totalEarned / Math.max(1, earnTransactions.length);

        // Tickets needed to complete goal
        const ticketsNeeded = activeGoal.product.price_locked_cents / TICKET_CENT_VALUE - activeGoal.tickets_saved;

        // Estimated days to completion
        const daysToCompletion = Math.ceil(ticketsNeeded / avgPerDay);

        if (daysToCompletion > 0) {
          estimatedCompletion = {
            days: daysToCompletion,
            weeks: Math.ceil(daysToCompletion / 7)
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
    const todayString = todayDate.toISOString().split('T')[0];

    const recentTransactions = await storage.getUserTransactions(targetUserId, 50);
    for (const tx of recentTransactions) {
      if (tx.type === 'earn' && tx.chore_id && tx.created_at && new Date(tx.created_at) >= todayDate) {
        completedChoreIds.add(tx.chore_id);
      }
    }

    // Get the daily bonus for this user if one exists
    const dailyBonusRecord = await storage.getDailyBonus(todayString, targetUserId); // Renamed

    // Get the assigned bonus chore if there is one
    let assignedBonusChore = null;
    if (dailyBonusRecord && dailyBonusRecord.assigned_chore_id) {
      assignedBonusChore = chores.find(c => c.id === dailyBonusRecord.assigned_chore_id) || null;
    }

    // Add completion status and bonus info to chores
    const choresWithStatus = chores.map(chore => ({
      ...chore,
      completed: completedChoreIds.has(chore.id),
      boostPercent: activeGoal ? calculateBoostPercent(chore.base_tickets, activeGoal.product.price_locked_cents) : 0,
      // Add bonus information if this chore is the assigned bonus chore for today
      is_bonus: dailyBonusRecord ? dailyBonusRecord.assigned_chore_id === chore.id : false,
      // If the chore is the bonus chore and has been completed (but wheel not spun), it's eligible for spin
      spin_eligible: dailyBonusRecord &&
        dailyBonusRecord.assigned_chore_id === chore.id &&
        completedChoreIds.has(chore.id) &&
        !dailyBonusRecord.is_spun
    }));

    // Check if the user is eligible for a bonus spin
    const isBonusSpinAvailable = !!dailyBonusRecord &&
      ((dailyBonusRecord.trigger_type === 'chore_completion' &&
        dailyBonusRecord.assigned_chore_id !== null &&
        completedChoreIds.has(dailyBonusRecord.assigned_chore_id)) ||
        dailyBonusRecord.trigger_type === 'good_behavior_reward') &&
      !dailyBonusRecord.is_spun;

    return res.json({
      balance,
      activeGoal: activeGoal ? {
        ...activeGoal,
        progress: progressPercent,
        estimatedCompletion
      } : null,
      chores: choresWithStatus,
      // Enhanced daily bonus information
      daily_bonus: {
        has_bonus_assignment: !!dailyBonusRecord,
        is_bonus_spin_available: isBonusSpinAvailable,
        daily_bonus_id: dailyBonusRecord?.id || null,
        assigned_bonus_chore_id: dailyBonusRecord?.assigned_chore_id || null,
        assigned_bonus_chore: assignedBonusChore ? {
          id: assignedBonusChore.id,
          name: assignedBonusChore.name,
          emoji: assignedBonusChore.emoji,
          tickets: assignedBonusChore.base_tickets,
          completed: completedChoreIds.has(assignedBonusChore.id)
        } : null,
        is_spun: dailyBonusRecord?.is_spun || false,
        spin_result_tickets: dailyBonusRecord?.spin_result_tickets || 0,
        trigger_type: dailyBonusRecord?.trigger_type || null
      }
    });
  });

  return httpServer;
}
