import { db } from "./db";
import { goals, products } from "@shared/schema";
import { and, eq, inArray, not } from "drizzle-orm";

/**
 * This script cleans up orphaned products in the database.
 * An orphaned product is one that doesn't have any goals referring to it.
 */
async function cleanupOrphanedProducts() {
  console.log("Starting database cleanup process...");

  try {
    // Get all product IDs in use by goals
    const goalProductIds = await db
      .select({ product_id: goals.product_id })
      .from(goals);

    // Extract unique product IDs
    const uniqueProductIds = goalProductIds.map((g) => g.product_id);
    const usedProductIds = uniqueProductIds.filter(
      (v, i, a) => a.indexOf(v) === i,
    );

    console.log(`Found ${usedProductIds.length} products in use by goals`);

    // Get a list of orphaned products (products not in usedProductIds)
    let orphanedProducts;

    if (usedProductIds.length === 0) {
      // If there are no goals at all, all products are orphaned
      orphanedProducts = await db.select().from(products);
    } else {
      // Otherwise, get products not referenced by any goal
      orphanedProducts = await db
        .select()
        .from(products)
        .where(not(inArray(products.id, usedProductIds)));
    }

    console.log(`Found ${orphanedProducts.length} orphaned products to delete`);

    // Delete orphaned products
    if (orphanedProducts.length > 0) {
      for (const product of orphanedProducts) {
        console.log(
          `Deleting orphaned product: ID ${product.id} - ${product.title}`,
        );
        await db.delete(products).where(eq(products.id, product.id));
      }

      console.log(
        `Deleted ${orphanedProducts.length} orphaned products successfully`,
      );
    } else {
      console.log("No orphaned products found, database is clean!");
    }

    return {
      deletedCount: orphanedProducts.length,
      deletedProducts: orphanedProducts,
    };
  } catch (error) {
    console.error("Error during database cleanup:", error);
    throw error;
  }
}

export { cleanupOrphanedProducts };
