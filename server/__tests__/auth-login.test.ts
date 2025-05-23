import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";

describe("POST /api/auth/login", () => {
  let app: express.Express;
  let server: any;

  const timestamp = Date.now();
  const parentData = {
    name: "Test Parent",
    username: `testparent_${timestamp}`,
    password: "password123",
    passwordHash: "password123", // For registration endpoint
    role: "parent" as const,
  };

  const childData = {
    name: "Test Child",
    username: `testchild_${timestamp}`,
    password: "childpass123",
  };

  let parentToken: string;

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

    // Create a child user via the family/children endpoint
    const childRes = await request(app)
      .post("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ name: childData.name });
    
    if (childRes.status !== 201 && childRes.status !== 200) {
      throw new Error(`Failed to create child: ${JSON.stringify(childRes.body)}`);
    }
    
    // Store the child's username for login tests
    childData.username = childRes.body.username;
    // Note: Child accounts have passwordHash: "DISABLED" so any password will fail
  });

  afterAll(() => {
    server?.close?.();
  });

  test("successful login for a parent account", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        username: parentData.username,
        password: parentData.password,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("token");
    expect(response.body.data).toHaveProperty("user");
    expect(response.body.data.user.username).toBe(parentData.username);
    expect(response.body.data.user.role).toBe("parent");
  });

  test("login attempt for a child user returns 401", async () => {
    // Note: Child accounts have passwordHash: "DISABLED" so authentication
    // fails at the password check (401) before reaching the role check (403)
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        username: childData.username,
        password: "any-password-will-fail",
      })
      .expect(401);

    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Invalid username or password");
  });

  test("login with invalid credentials returns 401", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        username: parentData.username,
        password: "wrongpassword",
      })
      .expect(401);

    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Invalid username or password");
  });

  test("login with non-existent user returns 401", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        username: "nonexistentuser",
        password: "somepassword",
      })
      .expect(401);

    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Invalid username or password");
  });
});