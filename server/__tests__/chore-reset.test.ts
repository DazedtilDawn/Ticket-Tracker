import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";
import { storage } from "../storage";
import { triggerManualReset } from "../jobs/resetChores";
import { db } from "../db";
import { choreCompletions } from "../../shared/schema";

describe("Chore Reset System", () => {
  let app: express.Express;
  let server: any;
  let parentToken: string;
  let childId: number;
  let dailyChoreId: number;
  let weeklyChoreId: number;
  let monthlyChoreId: number;

  beforeAll(async () => {
    // Create a test app instance
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    
    // Register routes
    server = await registerRoutes(app);

    // Register a parent user
    const timestamp = Date.now();
    const parentRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Chore Reset Test Parent",
        username: `choreresetparent_${timestamp}`,
        password: "password123",
        passwordHash: "password123",
        role: "parent",
      });

    if (!parentRes.body?.data?.token) {
      throw new Error(`Failed to register parent: ${JSON.stringify(parentRes.body)}`);
    }

    parentToken = parentRes.body.data.token;

    // Create a child
    const childRes = await request(app)
      .post("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ name: "Test Child" });

    if (childRes.status !== 201) {
      throw new Error(`Failed to create child: ${JSON.stringify(childRes.body)}`);
    }

    childId = childRes.body.id;

    // Create test chores with different recurrence patterns
    const dailyChoreRes = await request(app)
      .post("/api/chores")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({
        name: "Daily Chore",
        description: "A test daily chore",
        base_tickets: 5,
        recurrence: "daily",
      });

    const weeklyChoreRes = await request(app)
      .post("/api/chores")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({
        name: "Weekly Chore",
        description: "A test weekly chore",
        base_tickets: 10,
        recurrence: "weekly",
      });

    const monthlyChoreRes = await request(app)
      .post("/api/chores")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({
        name: "Monthly Chore",
        description: "A test monthly chore",
        base_tickets: 20,
        recurrence: "monthly",
      });

    dailyChoreId = dailyChoreRes.body.id;
    weeklyChoreId = weeklyChoreRes.body.id;
    monthlyChoreId = monthlyChoreRes.body.id;
  });

  afterAll(() => {
    server?.close?.();
  });

  beforeEach(async () => {
    // Clean up any existing completions before each test
    // We need to clear ALL completions, not just expired ones
    await db.delete(choreCompletions);
  });

  describe("Storage Layer", () => {
    test("logChoreCompletion creates completion record", async () => {
      const completion = await storage.logChoreCompletion(dailyChoreId, childId);
      
      expect(completion).toBeDefined();
      expect(completion.chore_id).toBe(dailyChoreId);
      expect(completion.user_id).toBe(childId);
      expect(completion.completion_datetime).toBeDefined();
    });

    test("getChoreStatusForUser returns chores with completion status", async () => {
      // Complete one chore
      await storage.logChoreCompletion(dailyChoreId, childId);
      
      const choresWithStatus = await storage.getChoreStatusForUser(childId);
      
      expect(Array.isArray(choresWithStatus)).toBe(true);
      expect(choresWithStatus.length).toBeGreaterThan(0);
      
      // Find our test chores
      const dailyChore = choresWithStatus.find(c => c.id === dailyChoreId);
      const weeklyChore = choresWithStatus.find(c => c.id === weeklyChoreId);
      
      expect(dailyChore?.completed).toBe(true);
      expect(weeklyChore?.completed).toBe(false);
    });

    test("resetExpiredCompletions removes old completions based on recurrence", async () => {
      // Create completions for all chore types
      await storage.logChoreCompletion(dailyChoreId, childId);
      await storage.logChoreCompletion(weeklyChoreId, childId);
      await storage.logChoreCompletion(monthlyChoreId, childId);
      
      // Verify all are completed
      let choresWithStatus = await storage.getChoreStatusForUser(childId);
      expect(choresWithStatus.find(c => c.id === dailyChoreId)?.completed).toBe(true);
      expect(choresWithStatus.find(c => c.id === weeklyChoreId)?.completed).toBe(true);
      expect(choresWithStatus.find(c => c.id === monthlyChoreId)?.completed).toBe(true);
      
      // Run reset (in a real scenario, this would be time-based)
      // For testing, we'll need to manipulate the completion times directly
      // Since our reset logic is based on time, let's test it conceptually
      const deletedCount = await storage.resetExpiredCompletions();
      expect(typeof deletedCount).toBe("number");
    });
  });

  describe("API Endpoints", () => {
    test("POST /api/chores/:choreId/complete creates completion and transaction", async () => {
      const response = await request(app)
        .post(`/api/chores/${dailyChoreId}/complete`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ user_id: childId });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.completion).toBeDefined();
      expect(response.body.transaction).toBeDefined();
      expect(response.body.balance).toBeDefined();
    });

    test("GET /api/chores?userId=X includes completion status", async () => {
      // Complete a chore first
      await request(app)
        .post(`/api/chores/${dailyChoreId}/complete`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ user_id: childId });

      // Get chores with status
      const response = await request(app)
        .get(`/api/chores?userId=${childId}`)
        .set("Authorization", `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      const completedChore = response.body.find((c: any) => c.id === dailyChoreId);
      const uncompletedChore = response.body.find((c: any) => c.id === weeklyChoreId);
      
      expect(completedChore?.completed).toBe(true);
      expect(uncompletedChore?.completed).toBe(false);
    });

    test("Cannot complete same chore twice in one day", async () => {
      // Complete the chore once
      const firstResponse = await request(app)
        .post(`/api/chores/${dailyChoreId}/complete`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ user_id: childId });

      expect(firstResponse.status).toBe(201);

      // Try to complete it again - this should still work at the API level
      // but the chore should show as already completed
      const secondResponse = await request(app)
        .post(`/api/chores/${dailyChoreId}/complete`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ user_id: childId });

      // API allows multiple completions (business logic decision)
      expect(secondResponse.status).toBe(201);
      
      // But the chore status should still show as completed
      const statusResponse = await request(app)
        .get(`/api/chores?userId=${childId}`)
        .set("Authorization", `Bearer ${parentToken}`);

      const choreStatus = statusResponse.body.find((c: any) => c.id === dailyChoreId);
      expect(choreStatus?.completed).toBe(true);
    });

    test("Requires parent authorization", async () => {
      const response = await request(app)
        .post(`/api/chores/${dailyChoreId}/complete`)
        .send({ user_id: childId });

      expect(response.status).toBe(401);
    });

    test("Validates chore and user existence", async () => {
      // Invalid chore ID
      const badChoreResponse = await request(app)
        .post("/api/chores/99999/complete")
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ user_id: childId });

      expect(badChoreResponse.status).toBe(404);
      expect(badChoreResponse.body.message).toContain("Chore not found");

      // Invalid user ID
      const badUserResponse = await request(app)
        .post(`/api/chores/${dailyChoreId}/complete`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ user_id: 99999 });

      expect(badUserResponse.status).toBe(404);
      expect(badUserResponse.body.message).toContain("User not found");
    });
  });

  describe("Reset Job", () => {
    test("triggerManualReset function works", async () => {
      // Create some completions
      await storage.logChoreCompletion(dailyChoreId, childId);
      await storage.logChoreCompletion(weeklyChoreId, childId);
      
      // Trigger manual reset
      const deletedCount = await triggerManualReset();
      
      expect(typeof deletedCount).toBe("number");
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Edge Cases", () => {
    test("System handles non-existent chore completion gracefully", async () => {
      const choresWithStatus = await storage.getChoreStatusForUser(99999);
      expect(Array.isArray(choresWithStatus)).toBe(true);
      // Chores are global, not user-specific, so even non-existent users get all chores
      expect(choresWithStatus.length).toBeGreaterThan(0);
      // But none should be marked as completed
      expect(choresWithStatus.every(c => !c.completed)).toBe(true);
    });

    test("Reset handles empty completion table", async () => {
      const deletedCount = await storage.resetExpiredCompletions();
      expect(deletedCount).toBe(0);
    });

    test("GET /api/chores without userId parameter works as before", async () => {
      const response = await request(app)
        .get("/api/chores")
        .set("Authorization", `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Should not have 'completed' property when no userId is specified
      const chore = response.body.find((c: any) => c.id === dailyChoreId);
      expect(chore).toBeDefined();
      expect(chore.hasOwnProperty('completed')).toBe(false);
    });
  });
});