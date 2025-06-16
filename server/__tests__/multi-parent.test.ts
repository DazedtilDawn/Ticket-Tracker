import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { createServer } from "../index";
import type { Express } from "express";
import type { Server } from "http";

describe("Multi-Parent Support", () => {
  let app: Express;
  let server: Server;
  let parentToken: string;
  let secondParentToken: string;
  let familyId: number;
  let secondParentEmail: string;
  let parentUsername: string;
  let parentId: number;

  beforeAll(async () => {
    const result = await createServer();
    app = result.app;
    server = result.server;
  });

  afterAll(async () => {
    if (server && server.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  });

  test("should create family on parent registration", async () => {
    parentUsername = `parent_${Date.now()}`;
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test Parent",
        username: parentUsername,
        email: `parent_${Date.now()}@example.com`,
        password: "password123",
        role: "parent"
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    parentToken = res.body.data.token;
    parentId = res.body.data.user.id;
    
    // Get family ID from user info
    const meRes = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${parentToken}`);
    
    expect(meRes.status).toBe(200);
    familyId = meRes.body.family_id;
    expect(familyId).toBeDefined();
  });

  test("should register second parent", async () => {
    secondParentEmail = `parent2_${Date.now()}@example.com`;
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Second Parent",
        username: `parent2_${Date.now()}`,
        email: secondParentEmail,
        password: "password123",
        role: "parent"
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    secondParentToken = res.body.data.token;
  });

  test("should invite second parent to family", async () => {

    // First parent invites second parent
    const res = await request(app)
      .post(`/api/families/${familyId}/invite-parent`)
      .set("Authorization", `Bearer ${parentToken}`)
      .send({
        email: secondParentEmail
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain("Parent added to family");
  });

  test("should list both parents in family", async () => {
    const res = await request(app)
      .get(`/api/families/${familyId}/parents`)
      .set("Authorization", `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.parents).toHaveLength(2);
    expect(res.body.data.parents.some((p: any) => p.name === "Test Parent")).toBe(true);
    expect(res.body.data.parents.some((p: any) => p.name === "Second Parent")).toBe(true);
  });

  test("should track performedById in transactions", async () => {
    // Create a child
    const childRes = await request(app)
      .post("/api/family/children")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({
        name: "Test Child"
      });

    expect(childRes.status).toBe(201);
    const childId = childRes.body.id;

    // Create a chore
    const choreRes = await request(app)
      .post("/api/chores")
      .set("Authorization", `Bearer ${parentToken}`)
      .send({
        name: "Test Chore",
        base_tickets: 5,
        recurrence: "daily"
      });

    expect(choreRes.status).toBe(201);
    const choreId = choreRes.body.id;

    // Complete the chore
    const completeRes = await request(app)
      .post(`/api/chores/${choreId}/complete`)
      .set("Authorization", `Bearer ${parentToken}`)
      .send({
        user_id: childId
      });

    expect(completeRes.status).toBe(201);
    expect(completeRes.body.transaction).toBeDefined();
    
    // Transaction should have performedById set to parent's ID
    const transaction = completeRes.body.transaction;
    expect(transaction.performed_by_id).toBeDefined();
  });

  test("should refresh access token", async () => {
    // First login to get cookies
    const agent = request.agent(app);
    
    const loginRes = await agent
      .post("/api/auth/login")
      .send({
        username: parentUsername,
        password: "password123"
      });

    expect(loginRes.status).toBe(200);
    
    // Now try to refresh
    const refreshRes = await agent
      .post("/api/auth/refresh");

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.access_token).toBeDefined();
  });
});