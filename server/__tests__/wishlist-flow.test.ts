import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";

describe("Wishlist flow", () => {
  let app: express.Express;
  let server: any;
  let parentToken: string;
  let childId: number;

  const timestamp = Date.now();
  const parentData = {
    name: "Wishlist Flow Parent",
    username: `wishlistflow_${timestamp}`,
    email: `wishlistflow_${timestamp}@example.com`,
    password: "password123",
    role: "parent" as const,
  };

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    server = await registerRoutes(app);

    // Register a parent user
    const parentRes = await request(app)
      .post("/api/auth/register")
      .send(parentData);
    
    if (parentRes.status !== 200 && parentRes.status !== 201) {
      throw new Error(`Failed to register parent: ${JSON.stringify(parentRes.body)}`);
    }
    
    parentToken = parentRes.body?.token || parentRes.body?.data?.token;
    if (!parentToken) {
      throw new Error(`No token in response: ${JSON.stringify(parentRes.body)}`);
    }

    // Create a child user
    const childRes = await request(app)
      .post("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({
        name: "Test Child",
        email: `testchild_${timestamp}@example.com`,
      });

    if (childRes.status !== 201) {
      throw new Error(`Failed to create child: ${JSON.stringify(childRes.body)}`);
    }

    childId = childRes.body.id;
  });

  afterAll(() => {
    if (server?.close) {
      server.close();
    }
  });

  test("creates, lists, updates progress, and converts to purchase", async () => {
    // 1. parent creates wishlist item
    const createRes = await request(app)
      .post("/api/wishlist")
      .send({ userId: childId, productId: 55 });
    expect(createRes.status).toBe(201);
    
    const wishlistItemId = createRes.body.data.id;

    // 2. list items – should return one
    const listRes = await request(app)
      .get(`/api/wishlist?userId=${childId}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].userId).toBe(childId);
    expect(listRes.body.data[0].productId).toBe(55);

    // 3. update progress to 100%
    const patchRes = await request(app)
      .patch(`/api/wishlist/${wishlistItemId}`)
      .send({ progress: 100 });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.success).toBe(true);
    expect(patchRes.body.data.progress).toBe(100);
    // When progress reaches 100%, should auto-convert to purchase
    expect(patchRes.body.data.is_purchased).toBe(true);
  });
});