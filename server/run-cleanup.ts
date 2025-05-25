import { cleanupOrphanedProducts } from "./cleanup";

async function main() {
  console.log("Starting cleanup process from script...");

  try {
    const result = await cleanupOrphanedProducts();
    console.log("Cleanup completed successfully!");
    console.log(`Deleted ${result.deletedCount} orphaned products`);

    if (result.deletedCount > 0) {
      console.log("Deleted products:");
      result.deletedProducts.forEach((product: any) => {
        console.log(`- ID: ${product.id}, Title: ${product.title}`);
      });
    }
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
}

main().catch(console.error);
