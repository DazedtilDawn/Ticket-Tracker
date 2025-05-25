import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";

describe("Archive child profiles", () => {
  let app: express.Express;
  let server: any;
  let parentToken: string;
  let otherParentToken: string;
  let childId: number;

  beforeAll(async () => {
    // Create a test app instance
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    
    // Register routes
    server = await registerRoutes(app);

    // register a parent and grab JWT
    const uniqueUsername = `archivetest_parent_${Date.now()}`;
    const parentRes = await request(app)
      .post("/api/auth/register")
      .send({ username: uniqueUsername, passwordHash: "pass", name: "Archiver", role: "parent" });
    
    if (!parentRes.body?.data?.token) {
      throw new Error(`Failed to register parent: ${JSON.stringify(parentRes.body)}`);
    }
    
    parentToken = parentRes.body.data.token;

    // Register another parent for permission testing
    const otherParentRes = await request(app)
      .post("/api/auth/register")
      .send({
        username: `other_archivetest_parent_${Date.now()}`,
        passwordHash: "otherpass",
        name: "Other Parent",
        role: "parent",
      });

    if (!otherParentRes.body?.data?.token) {
      throw new Error(`Failed to register other parent: ${JSON.stringify(otherParentRes.body)}`);
    }

    otherParentToken = otherParentRes.body.data.token;

    // create a child
    const childRes = await request(app)
      .post("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ name: "Archivable Kid" });
    
    if (childRes.status !== 201 && childRes.status !== 200) {
      throw new Error(`Failed to create child: ${JSON.stringify(childRes.body)}`);
    }
    
    childId = childRes.body.id;
  });

  afterAll(() => {
    server?.close?.();
  });

  test("parent can archive child", async () => {
    // archive
    const archiveRes = await request(app)
      .patch(`/api/family/children/${childId}/archive`)
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ archived: true });
      
    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.is_archived).toBe(true);
    expect(archiveRes.body.id).toBe(childId);
    expect(archiveRes.body.name).toBe("Archivable Kid");
  });

  test("archived child not in default list", async () => {
    // list should NOT include child by default
    const listRes = await request(app)
      .get("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`);
      
    expect(listRes.status).toBe(200);
    expect(listRes.body.find((c: any) => c.id === childId)).toBeUndefined();
  });

  test("archived child appears when includeArchived=true", async () => {
    // list WITH includeArchived should include the child
    const listRes = await request(app)
      .get("/api/family/children?includeArchived=true")
      .set("Authorization", `Bearer ${parentToken}`);
      
    expect(listRes.status).toBe(200);
    const archivedChild = listRes.body.find((c: any) => c.id === childId);
    expect(archivedChild).toBeDefined();
    expect(archivedChild.is_archived).toBe(true);
  });

  test("parent can restore archived child", async () => {
    // un-archive
    const unarchiveRes = await request(app)
      .patch(`/api/family/children/${childId}/archive`)
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ archived: false });
      
    expect(unarchiveRes.status).toBe(200);
    expect(unarchiveRes.body.is_archived).toBe(false);
  });

  test("restored child appears in default list", async () => {
    // list should include child again
    const listRes = await request(app)
      .get("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`);
      
    expect(listRes.status).toBe(200);
    const restoredChild = listRes.body.find((c: any) => c.id === childId);
    expect(restoredChild).toBeDefined();
    expect(restoredChild.is_archived).toBe(false);
  });

  test("other parent cannot archive child", async () => {
    const archiveRes = await request(app)
      .patch(`/api/family/children/${childId}/archive`)
      .set("Authorization", `Bearer ${otherParentToken}`)
      .send({ archived: true });
      
    expect(archiveRes.status).toBe(404);
    expect(archiveRes.body.message).toContain("does not belong");
  });

  test("non-parent cannot archive child", async () => {
    // Test with no auth header
    const archiveRes = await request(app)
      .patch(`/api/family/children/${childId}/archive`)
      .send({ archived: true });
      
    expect(archiveRes.status).toBe(401);
  });

  test("invalid archived value returns 400", async () => {
    const archiveRes = await request(app)
      .patch(`/api/family/children/${childId}/archive`)
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ archived: "maybe" }); // Invalid boolean
      
    expect(archiveRes.status).toBe(400);
  });

  test("archive non-existent child returns 404", async () => {
    const archiveRes = await request(app)
      .patch("/api/family/children/999999/archive")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({ archived: true });
      
    expect(archiveRes.status).toBe(404);
    expect(archiveRes.body.message).toContain("not found");
  });
});