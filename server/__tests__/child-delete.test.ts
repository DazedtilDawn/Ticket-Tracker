import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";

describe("DELETE /api/family/children/:childId", () => {
  let app: express.Express;
  let server: any;

  const timestamp = Date.now();
  const parentData = {
    name: "Delete Test Parent",
    username: `deleteparent_${timestamp}`,
    password: "password123",
    passwordHash: "password123", // For registration endpoint
    role: "parent" as const,
  };

  const childData = {
    name: "Delete Test Child",
    username: `deletechildtest_${timestamp}`,
    password: "childpass123",
  };

  let parentToken: string;
  let childId: number;

  beforeAll(async () => {
    // Create a test app instance
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    
    // Register routes
    server = await registerRoutes(app);

    // Register a parent user
    const parentRes = await request(app)
      .post("/api/auth/register")
      .send(parentData);
    
    if (parentRes.status !== 200 && parentRes.status !== 201) {
      throw new Error(`Failed to register parent: ${JSON.stringify(parentRes.body)}`);
    }
    
    // Check both possible response formats
    parentToken = parentRes.body?.token || parentRes.body?.data?.token;
    if (!parentToken) {
      throw new Error(`No token in response: ${JSON.stringify(parentRes.body)}`);
    }

    // Create a child using the parent token
    const childRes = await request(app)
      .post("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ name: childData.name });
    
    if (childRes.status !== 201) {
      throw new Error(`Failed to create child: ${JSON.stringify(childRes.body)}`);
    }

    // Store the child's info
    childId = childRes.body.id;
  });

  afterAll(() => {
    server?.close?.();
  });

  test("successful deletion by parent", async () => {
    const response = await request(app)
      .delete(`/api/family/children/${childId}`)
      .set("Authorization", `Bearer ${parentToken}`)
      .expect(200);

    expect(response.body).toEqual({
      id: childId,
      deleted: true,
    });

    // Verify child no longer exists
    const listRes = await request(app)
      .get("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`)
      .expect(200);

    expect(listRes.body).toHaveLength(0);
  });

  test("returns 404 for already deleted child", async () => {
    const response = await request(app)
      .delete(`/api/family/children/${childId}`)
      .set("Authorization", `Bearer ${parentToken}`)
      .expect(404);

    expect(response.body.message).toContain("not found");
  });

  test("returns 404 for non-existent child", async () => {
    const response = await request(app)
      .delete("/api/family/children/99999")
      .set("Authorization", `Bearer ${parentToken}`)
      .expect(404);

    expect(response.body.message).toContain("not found");
  });

  test("returns 401 without auth", async () => {
    const response = await request(app)
      .delete("/api/family/children/1")
      .expect(401);

    expect(response.body.message || response.body.error).toBe("Authentication required");
  });

  test("returns 400 for invalid childId", async () => {
    const response = await request(app)
      .delete("/api/family/children/invalid")
      .set("Authorization", `Bearer ${parentToken}`)
      .expect(400);

    expect(response.body.message).toBe("Invalid childId");
  });
});

describe("DELETE /api/family/children/:childId - permission tests", () => {
  let app: express.Express;
  let server: any;

  const timestamp = Date.now();
  const parent1Data = {
    name: "Parent One",
    username: `parent1delete_${timestamp}`,
    password: "password123",
    passwordHash: "password123",
    role: "parent" as const,
  };

  const parent2Data = {
    name: "Parent Two",
    username: `parent2delete_${timestamp}`,
    password: "password123",
    passwordHash: "password123",
    role: "parent" as const,
  };

  let parent1Token: string;
  let parent2Token: string;
  let childId: number;

  beforeAll(async () => {
    // Create a test app instance
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    
    // Register routes
    server = await registerRoutes(app);

    // Register and login parent 1
    const parent1Res = await request(app)
      .post("/api/auth/register")
      .send(parent1Data);
    
    if (parent1Res.status !== 200 && parent1Res.status !== 201) {
      throw new Error(`Failed to register parent1: ${JSON.stringify(parent1Res.body)}`);
    }
    
    parent1Token = parent1Res.body?.token || parent1Res.body?.data?.token;

    // Register and login parent 2
    const parent2Res = await request(app)
      .post("/api/auth/register")
      .send(parent2Data);
    
    if (parent2Res.status !== 200 && parent2Res.status !== 201) {
      throw new Error(`Failed to register parent2: ${JSON.stringify(parent2Res.body)}`);
    }
    
    parent2Token = parent2Res.body?.token || parent2Res.body?.data?.token;

    // Create a child for parent 1
    const childRes = await request(app)
      .post("/api/family/children")
      .set("Authorization", `Bearer ${parent1Token}`)
      .send({ name: "Child of Parent 1" })
      .expect(201);

    childId = childRes.body.id;

    // Children can no longer login directly, so we'll skip setting childToken
  });

  afterAll(() => {
    server?.close?.();
  });

  test("returns 404 when other parent tries to delete", async () => {
    const response = await request(app)
      .delete(`/api/family/children/${childId}`)
      .set("Authorization", `Bearer ${parent2Token}`)
      .expect(404);

    expect(response.body.message).toContain("does not belong");
  });

  test("returns 401 when no auth token provided", async () => {
    const response = await request(app)
      .delete(`/api/family/children/${childId}`)
      .expect(401);

    expect(response.body.message).toBe("Authentication required");
  });
});