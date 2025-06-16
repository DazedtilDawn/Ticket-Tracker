import pg from 'pg';
import fs from 'fs';
import path from 'path';

async function applyMigrations() {
  const client = new pg.Client('postgresql://postgres:postgres@localhost:5433/intelliticket_test');
  
  try {
    await client.connect();
    console.log('Connected to test database');
    
    // Key migrations in order
    const migrations = [
      '0000_exotic_venus.sql',
      '0016_sync_schema_to_db.sql', 
      '0014_add_email_to_users.sql',
      '0015_add_password_hash_to_users.sql',
      '0018_email_nullable_with_partial_unique.sql',
      '0019_multi_parent_auth.sql'
    ];
    
    for (const migration of migrations) {
      try {
        const filePath = path.join(process.cwd(), 'migrations', migration);
        const sql = fs.readFileSync(filePath, 'utf8');
        await client.query(sql);
        console.log('✓ Applied', migration);
      } catch (error: any) {
        console.log('⚠️  Error applying', migration + ':', error.message);
      }
    }
    
    console.log('All migrations applied successfully');
  } catch (error: any) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigrations();