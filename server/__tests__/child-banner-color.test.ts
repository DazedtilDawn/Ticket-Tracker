import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";

describe("Child banner color assignment", () => {
  let app: express.Express;
  let server: any;
  let parentToken: string;

  const allowedGradients = [
    "from-pink-500/30 to-indigo-300/30",
    "from-amber-400/30 to-rose-300/30",
    "from-lime-400/30 to-teal-300/30",
    "from-sky-400/30 to-fuchsia-300/30",
  ];

  beforeAll(async () => {
    // Create a test app instance
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    
    // Register routes
    server = await registerRoutes(app);

    // Register a parent and get token
    const uniqueUsername = `bannertest_parent_${Date.now()}`;
    const parentRes = await request(app)
      .post("/api/auth/register")
      .send({
        username: uniqueUsername,
        email: `${uniqueUsername}@example.com`,
        passwordHash: "testpass123",
        name: "Banner Test Parent",
        role: "parent",
      });

    if (!parentRes.body?.data?.token) {
      throw new Error(`Failed to register parent: ${JSON.stringify(parentRes.body)}`);
    }

    parentToken = parentRes.body.data.token;
  });

  afterAll(() => {
    server?.close?.();
  });

  test("new child gets banner_color_preference assigned", async () => {
    const childRes = await request(app)
      .post("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ name: "Test Child" });

    expect(childRes.status).toBe(201);
    expect(childRes.body).toHaveProperty("id");
    expect(childRes.body).toHaveProperty("name", "Test Child");
    expect(childRes.body).toHaveProperty("banner_color_preference");
    
    // Verify the assigned gradient is one of the allowed values
    expect(allowedGradients).toContain(childRes.body.banner_color_preference);
  });

  test("multiple children get different banner colors", async () => {
    const colors = new Set<string>();
    
    // Create 8 children to ensure we get some variety
    // (with 4 colors and random selection, we should get at least 2 different colors)
    for (let i = 0; i < 8; i++) {
      const childRes = await request(app)
        .post("/api/family/children")
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ name: `Child ${i}` });

      expect(childRes.status).toBe(201);
      expect(childRes.body).toHaveProperty("banner_color_preference");
      colors.add(childRes.body.banner_color_preference);
    }
    
    // Should have at least 2 different colors
    expect(colors.size).toBeGreaterThanOrEqual(2);
  });

  test("banner color is returned when fetching children", async () => {
    const childrenRes = await request(app)
      .get("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`);

    expect(childrenRes.status).toBe(200);
    expect(Array.isArray(childrenRes.body)).toBe(true);
    expect(childrenRes.body.length).toBeGreaterThan(0);
    
    // Check that all children have banner_color_preference
    childrenRes.body.forEach((child: any) => {
      expect(child).toHaveProperty("banner_color_preference");
      expect(allowedGradients).toContain(child.banner_color_preference);
    });
  });
});