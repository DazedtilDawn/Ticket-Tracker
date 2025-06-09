import pg from 'pg';
import fs from 'fs';

async function applyMigration() {
  const client = new pg.Client('postgresql://postgres:postgres@localhost:5433/intelliticket_test');
  
  try {
    await client.connect();
    const sql = fs.readFileSync('migrations/0020_rename_delta_tickets.sql', 'utf8');
    await client.query(sql);
    console.log('✓ Applied column rename migration');
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

applyMigration();