import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as path from "path";

const TEST_DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/intelliticket_test";

async function waitForDatabase(maxRetries = 30) {
  console.log("Waiting for test database connection...");
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const pool = new Pool({ connectionString: TEST_DATABASE_URL });
      await pool.query('SELECT 1');
      await pool.end();
      console.log("Test database is ready!");
      return;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(`Failed to connect to test database after ${maxRetries} attempts: ${error}`);
      }
      process.stdout.write(".");
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function runMigrations() {
  console.log("Running database migrations...");
  
  const pool = new Pool({ connectionString: TEST_DATABASE_URL });
  const db = drizzle(pool);
  
  try {
    const migrationsFolder = path.join(process.cwd(), "migrations");
    await migrate(db, { migrationsFolder });
    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

export async function setupTestDatabase() {
  try {
    await waitForDatabase();
    await runMigrations();
    
    // Set DATABASE_URL for the test environment
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    process.env.NODE_ENV = "test";
    
    console.log("Test database setup complete!");
  } catch (error) {
    console.error("Test database setup failed:", error);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupTestDatabase();
}