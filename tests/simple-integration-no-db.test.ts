import { test, expect } from "bun:test";
import { createServer } from "../server/index";

// Test that createServer works without database
test("createServer returns app and server objects", async () => {
  // Mock the database module to avoid connection errors
  const originalEnv = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgresql://mock:mock@localhost:5432/mock";
  
  try {
    const result = await createServer();
    
    // Check that we get back the expected structure
    expect(result).toHaveProperty("app");
    expect(result).toHaveProperty("server");
    expect(result.app).toBeDefined();
    expect(result.server).toBeDefined();
    
    // Check that app has expected Express methods
    expect(typeof result.app.use).toBe("function");
    expect(typeof result.app.get).toBe("function");
    expect(typeof result.app.post).toBe("function");
    
    // Close the server
    if (result.server && typeof result.server.close === "function") {
      result.server.close();
    }
  } finally {
    // Restore original env
    if (originalEnv) {
      process.env.DATABASE_URL = originalEnv;
    } else {
      delete process.env.DATABASE_URL;
    }
  }
});