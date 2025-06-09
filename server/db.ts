import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// Create a stub database object for testing
function createStubDb() {
  const dbDisabledError = () => {
    throw new Error("DB disabled in test environment");
  };

  // Create a chainable proxy that eventually throws
  const createChainableStub = (): any => {
    return new Proxy({}, {
      get(target, prop) {
        // For common Drizzle methods, return chainable stub
        if (["select", "insert", "update", "delete", "from", "where", "values", "returning", "set", "innerJoin", "leftJoin", "rightJoin", "orderBy", "limit", "offset", "groupBy", "having"].includes(String(prop))) {
          return () => createChainableStub();
        }
        // For terminal methods, return async function that throws
        if (typeof prop === "string") {
          return async (...args: any[]) => dbDisabledError();
        }
        return dbDisabledError();
      }
    });
  };

  const stubDb = createChainableStub();

  const stubPool: any = {
    query: async () => dbDisabledError(),
    connect: async () => dbDisabledError(),
    end: async () => {},
    on: () => {},
  };

  return { db: stubDb as any, pool: stubPool as any };
}

// Create real database connection
function createRealDb() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  return { db, pool };
}

/**
 * Creates a database connection based on environment configuration.
 * 
 * In test mode (NODE_ENV=test):
 * - Returns stub database by default for isolated unit testing
 * - Set USE_REAL_DB=true to use real database for integration tests
 * 
 * In all other modes:
 * - Requires DATABASE_URL and returns real database connection
 * 
 * @returns Database instance (real or stub based on configuration)
 */
export function createDb() {
  // In test mode, use stub unless explicitly requesting real DB
  if (process.env.NODE_ENV === "test" && process.env.USE_REAL_DB !== "true") {
    console.warn("Database connection disabled (test mode with stub)");
    return createStubDb();
  }

  // Otherwise, require DATABASE_URL and use real database
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  
  return createRealDb();
}

// Create and export the database instances
const dbInstances = createDb();
export const db = dbInstances.db;
export const pool = dbInstances.pool;
