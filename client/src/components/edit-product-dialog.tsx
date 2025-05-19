import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  price_cents: z.coerce.number().int().min(1, { message: "Price must be positive" }),
  image_url: z.string().url().optional().or(z.literal(""))
});

interface EditProductDialogProps {
  product: any;
  children: React.ReactNode;
  onProductUpdated?: () => void;
}

export function EditProductDialog({ product, children, onProductUpdated }: EditProductDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: product.title,
      price_cents: product.price_cents / 100, // show dollars
      image_url: product.image_url || ""
    }
  });

  const handleSubmit = async (values: any) => {
    try {
      await apiRequest(`/api/products/${product.id}`, {
        method: "PUT",
        body: {
          title: values.title,
          price_cents: Math.round(parseFloat(values.price_cents) * 100),
          image_url: values.image_url || null
        }
      });
      toast({ title: "Product updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      if (onProductUpdated) onProductUpdated();
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to update product", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price_cents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (dollars)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

