import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";

describe("Edit child profile", () => {
  let app: express.Express;
  let server: any;
  let parentToken: string;
  let childId: number;
  let otherParentToken: string;

  beforeAll(async () => {
    // Create a test app instance
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    
    // Register routes
    server = await registerRoutes(app);

    // Register a parent and get token
    const uniqueUsername = `editparent_${Date.now()}`;
    const parentRes = await request(app)
      .post("/api/auth/register")
      .send({
        username: uniqueUsername,
        email: `${uniqueUsername}@example.com`,
        passwordHash: "testpass123",
        name: "Edit Test Parent",
        role: "parent",
      });

    if (!parentRes.body?.data?.token) {
      throw new Error(`Failed to register parent: ${JSON.stringify(parentRes.body)}`);
    }

    parentToken = parentRes.body.data.token;

    // Create a child to edit
    const childRes = await request(app)
      .post("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ name: "Original Child Name" });

    if (childRes.status !== 201) {
      throw new Error(`Failed to create child: ${JSON.stringify(childRes.body)}`);
    }

    childId = childRes.body.id;

    // Register another parent for permission testing
    const otherParentRes = await request(app)
      .post("/api/auth/register")
      .send({
        username: `otherparent_${Date.now()}`,
        email: `otherparent_${Date.now()}@example.com`,
        passwordHash: "otherpass123",
        name: "Other Parent",
        role: "parent",
      });

    if (!otherParentRes.body?.data?.token) {
      throw new Error(`Failed to register other parent: ${JSON.stringify(otherParentRes.body)}`);
    }

    otherParentToken = otherParentRes.body.data.token;
  });

  afterAll(() => {
    server?.close?.();
  });

  test("parent can update child's name", async () => {
    const updateRes = await request(app)
      .put(`/api/family/children/${childId}`)
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ name: "Updated Child Name" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body).toHaveProperty("id", childId);
    expect(updateRes.body).toHaveProperty("name", "Updated Child Name");
    expect(updateRes.body).toHaveProperty("username");
    expect(updateRes.body).toHaveProperty("banner_color_preference");
  });

  test("parent can update child's profile image URL", async () => {
    const updateRes = await request(app)
      .put(`/api/family/children/${childId}`)
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ 
        profile_image_url: "/uploads/profiles/test-image.jpg" 
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body).toHaveProperty("profile_image_url", "/uploads/profiles/test-image.jpg");
  });

  test("parent can update both name and profile image", async () => {
    const updateRes = await request(app)
      .put(`/api/family/children/${childId}`)
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ 
        name: "New Name",
        profile_image_url: "/uploads/profiles/new-image.jpg" 
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body).toHaveProperty("name", "New Name");
    expect(updateRes.body).toHaveProperty("profile_image_url", "/uploads/profiles/new-image.jpg");
  });

  test("parent can clear profile image by setting to null", async () => {
    const updateRes = await request(app)
      .put(`/api/family/children/${childId}`)
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ 
        profile_image_url: null 
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.profile_image_url).toBeNull();
  });

  test("cannot update with invalid data", async () => {
    const updateRes = await request(app)
      .put(`/api/family/children/${childId}`)
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ 
        name: "", // Empty name should fail validation
      });

    expect(updateRes.status).toBe(400);
  });

  test("cannot update child that doesn't belong to parent", async () => {
    const updateRes = await request(app)
      .put(`/api/family/children/${childId}`)
      .set("Authorization", `Bearer ${otherParentToken}`)
      .send({ name: "Hacked Name" });

    expect(updateRes.status).toBe(404);
    expect(updateRes.body).toHaveProperty("message");
    expect(updateRes.body.message).toContain("does not belong");
  });

  test("non-parent cannot update child", async () => {
    // Create a child user token by switching to child view
    // Since children can't login directly, we'll test with missing auth
    const updateRes = await request(app)
      .put(`/api/family/children/${childId}`)
      .send({ name: "Unauthorized Update" });

    expect(updateRes.status).toBe(401); // No auth header
  });

  test("cannot update non-existent child", async () => {
    const updateRes = await request(app)
      .put("/api/family/children/999999")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ name: "Ghost Child" });

    expect(updateRes.status).toBe(404);
    expect(updateRes.body).toHaveProperty("message", "Child not found");
  });

  test("updates are reflected when fetching children list", async () => {
    // First update the child
    await request(app)
      .put(`/api/family/children/${childId}`)
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ name: "Final Updated Name" });

    // Then fetch the children list
    const listRes = await request(app)
      .get("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`);

    expect(listRes.status).toBe(200);
    const updatedChild = listRes.body.find((c: any) => c.id === childId);
    expect(updatedChild).toBeDefined();
    expect(updatedChild.name).toBe("Final Updated Name");
  });
});