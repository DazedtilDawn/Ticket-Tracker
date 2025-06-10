import { db } from '../db';
import { wishlistItems } from '../../shared/schema';

export async function createWishlistItem({ userId, productId }: { userId: number; productId: number; }) {
  const [row] = await db.insert(wishlistItems).values({ userId, productId }).returning();
  return row;
}