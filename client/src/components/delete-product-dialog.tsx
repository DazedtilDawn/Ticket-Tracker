import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ReactNode } from "react";

interface DeleteProductDialogProps {
  productId: number;
  productTitle: string;
  onProductDeleted: () => void;
  children: ReactNode;
}

export function DeleteProductDialog({ 
  productId, 
  productTitle, 
  onProductDeleted, 
  children 
}: DeleteProductDialogProps) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/products/${productId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({ 
        title: "Product deleted successfully" 
      });
      onProductDeleted();
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting product",
        description: error.message || "This product may be used in active goals",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Product</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{productTitle}"? This action cannot be undone.
            Products used in active goals cannot be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}