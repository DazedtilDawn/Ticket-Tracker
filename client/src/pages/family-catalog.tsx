import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { SharedCatalog } from "@/components/shared-catalog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function FamilyCatalog() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createGoalMutation = useMutation({
    mutationFn: async (productId: number) => {
      console.log("Creating goal for product:", productId, "user:", user?.id);
      const response = await apiRequest(`/api/goals`, {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          user_id: user?.id,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Goal creation response:", response);
      return response;
    },
    onSuccess: (data) => {
      console.log("Goal created successfully:", data);
      toast({
        title: "Added to wishlist! 🎯",
        description: "Your new goal has been set. Start earning tickets!",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error: any) => {
      console.error("Goal creation failed:", error);
      toast({
        title: "Oops! Something went wrong",
        description: error.message || "Could not add item to wishlist",
        variant: "destructive",
      });
    },
  });

  const handleProductSelected = (productId: number) => {
    console.log("Product selected for goal:", productId);
    createGoalMutation.mutate(productId);
  };

  return <SharedCatalog onProductSelected={handleProductSelected} />;
}
