import { useState } from "react";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Check, AlertTriangle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

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
  const [confirmText, setConfirmText] = useState("");
  const [step, setStep] = useState(1);
  
  // Check if this product is being used in any goals
  const { data: usageCheck, isLoading: checkingUsage } = useQuery({
    queryKey: ["/api/goals", `?productId=${productId}`], 
    enabled: step === 1,
  });
  
  const hasActiveGoals = usageCheck?.some((goal: any) => goal.is_active);
  const hasInactiveGoals = usageCheck?.some((goal: any) => !goal.is_active);
  const isConfirmEnabled = confirmText.toLowerCase() === "delete";

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/products/${productId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({ 
        title: "Product deleted successfully",
        description: `"${productTitle}" has been removed from the catalog.`,
        variant: "default"
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
    if (step === 1 && !hasActiveGoals) {
      setStep(2);
      return;
    }
    
    if (step === 2 && isConfirmEnabled) {
      deleteMutation.mutate();
    }
  };

  const getStepContent = () => {
    if (step === 1) {
      return (
        <>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productTitle}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {checkingUsage ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
              <span>Checking if this product is in use...</span>
            </div>
          ) : (
            <div className="py-2 space-y-3">
              {hasActiveGoals ? (
                <div className="flex items-start p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-200">Cannot Delete</h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      This product is currently used in active goals. Please deactivate all goals using this product first.
                    </p>
                  </div>
                </div>
              ) : hasInactiveGoals ? (
                <div className="flex items-start p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200">Warning</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      This product is used in inactive goals. Deleting it will permanently remove these goals.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-md">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-200">Safe to Delete</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      This product is not used in any goals and can be safely deleted.
                    </p>
                  </div>
                </div>
              )}

              <div className="py-1">
                <h4 className="text-sm font-medium mb-1">Product Details:</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center">
                    <span className="text-gray-600 dark:text-gray-400 mr-2">Title:</span> 
                    {productTitle}
                  </li>
                  <li className="flex items-center">
                    <span className="text-gray-600 dark:text-gray-400 mr-2">ID:</span> 
                    <Badge variant="outline" className="text-xs">{productId}</Badge>
                  </li>
                </ul>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStep(1)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending || hasActiveGoals || checkingUsage}
            >
              {deleteMutation.isPending ? "Deleting..." : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </>
      );
    }
    
    if (step === 2) {
      return (
        <>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. To confirm, please type <span className="font-bold">delete</span> below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Type 'delete' to confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mb-2"
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStep(1)}>Back</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={!isConfirmEnabled || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </>
      );
    }
    
    return null;
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        {getStepContent()}
      </AlertDialogContent>
    </AlertDialog>
  );
}
