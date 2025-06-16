import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";
import { CHILD_BANNER_GRADIENTS } from "../storage";

describe("POST /api/family/children", () => {
  let app: express.Express;
  let server: any;
  let parentToken: string;

  const timestamp = Date.now();
  const parentData = {
    name: "Add Child Test Parent",
    username: `addchildparent_${timestamp}`,
    password: "password123",
    passwordHash: "password123", // For registration endpoint
    role: "parent" as const,
  };
  

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
  });

  afterAll(() => {
    server?.close?.();
  });

  test("parent can create child and receives id/username/banner_color_preference", async () => {
    const childName = "Test Child One";
    
    const response = await request(app)
      .post("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ name: childName })
      .expect(201);

    // Verify response structure
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("username");
    expect(response.body).toHaveProperty("name", childName);
    expect(response.body).toHaveProperty("banner_color_preference");
    
    // Verify username format (nanoid can include - and _)
    expect(response.body.username).toMatch(new RegExp(`^${parentData.username}_child_[a-zA-Z0-9_-]{6}$`));
    
    // Verify gradient is from allowed list
    expect(CHILD_BANNER_GRADIENTS).toContain(response.body.banner_color_preference);
  });

  test("username is unique across multiple children", async () => {
    const childrenData = [
      { name: "Child Two" },
      { name: "Child Three" },
      { name: "Child Four" },
    ];
    
    const usernames = new Set<string>();
    
    for (const child of childrenData) {
      const response = await request(app)
        .post("/api/family/children")
        .set("Authorization", `Bearer ${parentToken}`)
        .send(child)
        .expect(201);
      
      // Check username is unique
      expect(usernames.has(response.body.username)).toBe(false);
      usernames.add(response.body.username);
    }
    
    // All usernames should be unique
    expect(usernames.size).toBe(childrenData.length);
  });

  test("child belongs to parent (appears in GET /api/family/children)", async () => {
    // Create a child
    const createRes = await request(app)
      .post("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ name: "Child to Verify" })
      .expect(201);
    
    const createdChildId = createRes.body.id;
    
    // Get all children for this parent
    const listRes = await request(app)
      .get("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`)
      .expect(200);
    
    // Verify the created child is in the list
    const childInList = listRes.body.find((child: any) => child.id === createdChildId);
    expect(childInList).toBeDefined();
    expect(childInList.name).toBe("Child to Verify");
  });

  test("non-parent cannot create child", async () => {
    // This would require creating a child user and trying to use their token
    // Since children can't login directly after AUTH-02, we can't test this scenario
    // Instead, we'll test with no auth
    const response = await request(app)
      .post("/api/family/children")
      .send({ name: "Unauthorized Child" })
      .expect(401);
    
    expect(response.body.message || response.body.error).toBe("Authentication required");
  });

  test("validates required name field", async () => {
    const response = await request(app)
      .post("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({}) // Missing name
      .expect(400);
    
    expect(response.body.message).toBeDefined();
  });

  test("accepts single character names", async () => {
    const response = await request(app)
      .post("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ name: "X" }) // Single character is allowed
      .expect(201);
    
    expect(response.body.name).toBe("X");
  });
});