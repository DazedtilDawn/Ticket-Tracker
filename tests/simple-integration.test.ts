import { test, expect } from "bun:test";
import request from "supertest";
import express from "express";
import { createApp } from "../server/index";
import { storage } from "../server/storage";

// Test the specific changes we made
test.describe("Integration tests for recent changes", () => {
  let app: express.Express;
  let server: any;
  let parentToken: string;

  test.beforeAll(async () => {
    // Create app instance
    app = express();
    app.use(express.json());
    
    // Set up routes
    const { router } = await createApp();
    app.use(router);
    
    server = app.listen(0);

    // Create a test parent user
    const timestamp = Date.now();
    const parentData = {
      name: "Test Parent",
      username: `testparent_${timestamp}`,
      password: "password123",
      passwordHash: "password123",
      role: "parent" as const,
    };

    await storage.createUser(parentData);

    // Login as parent
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        username: parentData.username,
        password: "password123",
      });

    parentToken = loginRes.body.token;
  });

  test.afterAll(() => {
    server?.close?.();
  });

  test("getChildUsers filters out archived children", async () => {
    // This test would need to be in the frontend
    // But we can test the API behavior
    
    // Create two children
    const child1Res = await request(app)
      .post("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ name: "Active Child" });
    
    const child2Res = await request(app)
      .post("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ name: "Archived Child" });

    const child1Id = child1Res.body.id;
    const child2Id = child2Res.body.id;

    // Archive the second child
    await request(app)
      .patch(`/api/family/children/${child2Id}/archive`)
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ archived: true });

    // Get children without includeArchived
    const activeRes = await request(app)
      .get("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`);

    expect(activeRes.body.length).toBe(1);
    expect(activeRes.body[0].id).toBe(child1Id);
    expect(activeRes.body[0].is_archived).toBe(false);

    // Get children with includeArchived
    const allRes = await request(app)
      .get("/api/family/children?includeArchived=true")
      .set("Authorization", `Bearer ${parentToken}`);

    expect(allRes.body.length).toBe(2);
    expect(allRes.body.find((c: any) => c.id === child2Id).is_archived).toBe(true);
  });

  test("child gets banner_color_preference on creation", async () => {
    const childRes = await request(app)
      .post("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ name: "Banner Test Child" });

    expect(childRes.status).toBe(201);
    expect(childRes.body.banner_color_preference).toBeDefined();
    expect(childRes.body.banner_color_preference).toMatch(/from-.*to-.*/);
  });

  test("chore completion prevents duplicates", async () => {
    // Get a chore
    const choresRes = await request(app)
      .get("/api/chores")
      .set("Authorization", `Bearer ${parentToken}`);
    
    if (choresRes.body.length === 0) {
      // Create a chore if none exist
      await storage.createChore({
        name: "Test Chore",
        description: "Test",
        base_tickets: 5,
        recurrence: "daily"
      });
    }

    const chores = await storage.getChores();
    const choreId = chores[0].id;

    // Create a child to complete the chore
    const childRes = await request(app)
      .post("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ name: "Chore Test Child" });

    const childId = childRes.body.id;

    // First completion
    const firstCompletion = await storage.logChoreCompletion(choreId, childId);
    expect(firstCompletion.id).toBeDefined();

    // Second completion on same day should return the same record
    const secondCompletion = await storage.logChoreCompletion(choreId, childId);
    expect(secondCompletion.id).toBe(firstCompletion.id);
  });

  test("bonus wheel x2 has no cap", async () => {
    // This is tested in the route handler
    // The change was removing Math.min(baseTickets * 2, 10)
    // Now it's just baseTickets * 2
    
    // We can verify the logic by checking the code
    const routesContent = await Bun.file("./server/routes.ts").text();
    
    // Should NOT contain the capped version
    expect(routesContent).not.toContain("Math.min(baseTickets * 2, 10)");
    
    // Should contain the uncapped version
    expect(routesContent).toContain("bonusTickets = baseTickets * 2");
  });
});