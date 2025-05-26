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
      return apiRequest(`/api/goals`, {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          user_id: user?.id,
        }),
      });
    },
    onSuccess: () => {
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
