import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";

// Don't mock initially - we want to see the real failure

describe("Wishlist API", () => {
  let app: express.Express;
  let server: any;
  let parentToken: string;
  let childId: number;

  const timestamp = Date.now();
  const parentData = {
    name: "Wishlist Test Parent",
    username: `wishlistparent_${timestamp}`,
    email: `wishlistparent_${timestamp}@example.com`,
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

  test("creates wishlist item for child", async () => {
    const res = await request(app)
      .post("/api/wishlist")
      .send({ userId: childId, productId: 55 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      userId: childId,
      productId: 55,
      progress: 0
    });
  });
});