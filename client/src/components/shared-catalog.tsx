```tsx
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { AddProductDialog } from './add-product-dialog';
import { EditProductDialog } from './edit-product-dialog';
import { DeleteProductDialog } from './delete-product-dialog';

import { useAuthStore } from '@/store/auth-store';
import { Gift, ArrowRight, Pencil, Trash2 } from 'lucide-react';

import {
  createWebSocketConnection,
  subscribeToChannel,
} from '@/lib/supabase';

interface SharedCatalogProps {
  onProductSelected: (productId: number) => void;
}

export function SharedCatalog({ onProductSelected }: SharedCatalogProps) {
  const { user } = useAuthStore();
  const isParent = user?.role === 'parent';

  /* ──────────────────────────────────────────────────────────────────
     Data
  ────────────────────────────────────────────────────────────────── */
  const { data: products = [] } = useQuery({
    queryKey: ['/api/products'],
  });

  /* ──────────────────────────────────────────────────────────────────
     Real-time product updates
  ────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    createWebSocketConnection();

    const unsubUpdate = subscribeToChannel('product:update', () =>
      queryClient.invalidateQueries({ queryKey: ['/api/products'] }),
    );
    const unsubDelete = subscribeToChannel('product:deleted', () =>
      queryClient.invalidateQueries({ queryKey: ['/api/products'] }),
    );

    return () => {
      unsubUpdate();
      unsubDelete();
    };
  }, []);

  /* ──────────────────────────────────────────────────────────────────
     Helpers
  ────────────────────────────────────────────────────────────────── */
  const refreshCatalog = () =>
    queryClient.invalidateQueries({ queryKey: ['/api/products'] });

  const handleAddToWishlist = (productId: number) =>
    onProductSelected(productId);

  /* ──────────────────────────────────────────────────────────────────
     UI
  ────────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
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

      {/* Empty-state ­═══════════════════════════════════════════════ */}
      {products.length === 0 ? (
        <div className="rounded-lg border bg-slate-50 p-8 text-center dark:bg-slate-900/50">
          <Gift className="mx-auto mb-3 h-12 w-12 text-slate-400" />
          <h3 className="mb-2 text-lg font-medium">
            No products in the catalog yet
          </h3>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Products added to the catalog will be available for everyone in the
            family.
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
        /* Product list ­════════════════════════════════════════════ */
        <ScrollArea className="h-[500px] rounded-md border p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product: any) => (
              <Card
                key={product.id}
                className="overflow-hidden transition-shadow hover:shadow-lg"
              >
                {/* Image */}
                <div className="flex h-32 bg-slate-100 dark:bg-slate-800">
                  {product.image_url ? (
                    <img
                      alt={product.title}
                      className="mx-auto h-full w-auto object-contain"
                      src={product.image_url}
                    />
                  ) : (
                    <div className="flex w-full items-center justify-center">
                      <Gift className="h-12 w-12 text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <CardContent className="p-4">
                  <h3 className="mb-2 line-clamp-2 font-medium">
                    {product.title}
                  </h3>

                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                    >
                      ${(product.price_cents / 100).toFixed(2)}
                    </Badge>

                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {product.asin ? 'Amazon' : 'Custom'}
                    </span>
                  </div>
                </CardContent>

                {/* Actions */}
                <CardFooter className="flex justify-between p-4 pt-0">
                  {isParent && (
                    <div className="flex space-x-2">
                      {/* Edit */}
                      <EditProductDialog
                        product={product}
                        onProductUpdated={refreshCatalog}
                      >
                        <Button size="sm" variant="outline">
                          <Pencil className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                      </EditProductDialog>

                      {/* Delete */}
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

                  {/* Wishlist */}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAddToWishlist(product.id)}
                  >
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
```
