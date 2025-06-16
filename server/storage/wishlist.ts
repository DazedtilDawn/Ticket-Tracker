import { db } from '../db';
import { wishlistItems } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export async function createWishlistItem({ userId, productId }: { userId: number; productId: number; }) {
  const [row] = await db.insert(wishlistItems).values({ userId, productId }).returning();
  return row;
}

export async function listWishlistItems(userId: number) {
  return db.select().from(wishlistItems).where(eq(wishlistItems.userId, userId));
}

export async function updateWishlistProgress(id: number, progress: number) {
  // Auto-convert to purchase when progress reaches 100%
  const is_purchased = progress >= 100;
  
  const [row] = await db
    .update(wishlistItems)
    .set({ progress, is_purchased })
    .where(eq(wishlistItems.id, id))
    .returning();
  
  return row;
}