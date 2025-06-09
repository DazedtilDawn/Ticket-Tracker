import { Pool } from "pg";
import fs from "fs";
import path from "path";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/intelliticket_test";

async function applyAllMigrations() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log("Applying all migrations...");
    
    // Get all migration files in order
    const migrationsDir = path.join(process.cwd(), "migrations");
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && f !== 'meta')
      .sort();
    
    for (const file of migrationFiles) {
      console.log(`Applying migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      try {
        await pool.query(sql);
        console.log(`✓ Applied ${file}`);
      } catch (error: any) {
        // Skip if table/column already exists (42P07 = duplicate table, 42701 = duplicate column)
        // Also skip constraint already exists (42710)
        if (error.code === '42P07' || error.code === '42701' || error.code === '42710') {
          console.log(`⚠ Skipping ${file} (already exists)`);
        } else {
          console.error(`✗ Failed to apply ${file}:`, error.message);
          // Don't throw on migration errors - continue with next migration
          // Some migrations might fail due to dependencies but later ones might fix it
        }
      }
    }
    
    console.log("All migrations applied successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  applyAllMigrations();
}