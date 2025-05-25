import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { SharedCatalog } from "@/components/shared-catalog";

export default function FamilyCatalog() {
  const handleProductSelected = (productId: number) => {
    // Handle product selection for goal setting
    console.log("Product selected for goal:", productId);
  };

  return <SharedCatalog onProductSelected={handleProductSelected} />;
}
