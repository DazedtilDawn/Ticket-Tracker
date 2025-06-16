import { db } from "../server/db";
import { users } from "../shared/schema";
import { sql } from "drizzle-orm";

async function checkUsers() {
  console.log("Checking all users in the database...\n");
  
  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    familyId: users.family_id,
    isActive: users.is_active,
    isArchived: users.is_archived
  })
  .from(users)
  .orderBy(users.id);
  
  console.log("All users:");
  console.table(allUsers);
  
  console.log(`\nTotal users: ${allUsers.length}`);
  console.log("\nUsers to keep:");
  console.log("- Parent: ID 503");
  console.log("- Child: ID 611 (Bryce)");
  console.log("- Child: ID 612 (Kiki)");
  
  const usersToDelete = allUsers.filter(u => ![503, 611, 612].includes(u.id));
  console.log(`\nUsers to delete: ${usersToDelete.length}`);
  if (usersToDelete.length > 0) {
    console.log("IDs to delete:", usersToDelete.map(u => u.id).join(", "));
  }
  
  // Check if parent has correct family_id
  const parent = allUsers.find(u => u.id === 503);
  if (parent && parent.familyId !== 503) {
    console.log(`\n⚠️  Parent user 503 has incorrect family_id: ${parent.familyId} (should be 503)`);
  }
  
  process.exit(0);
}

checkUsers().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});