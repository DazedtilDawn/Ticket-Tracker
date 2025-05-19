import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AddProductDialog } from './add-product-dialog';
import { EditProductDialog } from './edit-product-dialog';
import { DeleteProductDialog } from './delete-product-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';
import { Gift, ArrowRight, PencilIcon, Trash2 } from 'lucide-react';

export function SharedCatalog({ onProductSelected }: { onProductSelected: (productId: number) => void }) {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const isParent = user?.role === 'parent';
  
  // Get all available products
  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const handleAddToWishlist = (productId: number) => {
    onProductSelected(productId);
  };

  const refreshCatalog = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Family Catalog</h2>
        {isParent && (
          <AddProductDialog onProductAdded={refreshCatalog}>
            <Button size="sm">
              <Gift className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </AddProductDialog>
        )}
      </div>
            
      {products.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
          <Gift className="h-12 w-12 mx-auto mb-3 text-slate-400" />
          <h3 className="text-lg font-medium mb-2">No products in the catalog yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Products added to the catalog will be available for everyone in the family.
          </p>
          {isParent && (
            <AddProductDialog onProductAdded={refreshCatalog}>
              <Button>
                <Gift className="mr-2 h-4 w-4" />
                Add Your First Product
              </Button>
            </AddProductDialog>
          )}
        </div>
      ) : (
        <ScrollArea className="h-[500px] rounded-md border p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product: any) => (
              <Card
                key={product.id}
                className="overflow-hidden transition-shadow hover:shadow-lg"
              >
                <div className="flex h-32 bg-slate-100 dark:bg-slate-800">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="h-full w-auto mx-auto object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full">
                      <Gift className="h-12 w-12 text-slate-400" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium line-clamp-2 mb-2">{product.title}</h3>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                      ${(product.price_cents / 100).toFixed(2)}
                    </Badge>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {product.asin ? 'Amazon' : 'Custom'}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  {isParent && (
                    <div className="flex space-x-2">
                      <EditProductDialog 
                        product={product} 
                        onProductUpdated={refreshCatalog}
                      >
                        <Button size="sm" variant="outline">
                          <PencilIcon className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                      </EditProductDialog>
                      
                      <DeleteProductDialog
                        productId={product.id}
                        productTitle={product.title}
                        onProductDeleted={refreshCatalog}
                      >
                        <Button size="sm" variant="destructive">
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      </DeleteProductDialog>
                    </div>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => handleAddToWishlist(product.id)}>
                    Add to Wishlist
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}