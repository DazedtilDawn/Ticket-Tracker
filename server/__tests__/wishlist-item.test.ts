import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";

// Don't mock initially - we want to see the real failure

describe("Wishlist API", () => {
  let app: express.Express;
  let server: any;

  beforeAll(() => {
    app = express();
    server = registerRoutes(app);
  });

  afterAll(() => {
    if (server?.close) {
      server.close();
    }
  });

  test("creates wishlist item for child", async () => {
    const res = await request(app)
      .post("/api/wishlist")
      .send({ userId: 4, productId: 55 });

    // Debug: log the response to see what we're getting
    console.log("Response status:", res.status);
    console.log("Response body:", res.body);

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual({
      id: 1,
      user_id: 4,
      product_id: 55,
      progress: 0
    });
  });
});