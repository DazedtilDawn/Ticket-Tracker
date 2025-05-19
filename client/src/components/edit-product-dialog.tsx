import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const manualSchema = z.object({
  title: z.string().min(1, { message: "Product title is required" }),
  price_cents: z.coerce.number()
    .int({ message: "Price must be a whole number" })
    .min(1, { message: "Price must be greater than 0" }),
  image_url: z.string().url({ message: "Image URL must be valid" }).optional().or(z.literal("")),
  amazonUrl: z.string().url({ message: "Amazon URL must be valid" }).optional().or(z.literal("")),
});

type ManualValues = z.infer<typeof manualSchema>;

interface EditProductDialogProps {
  children: React.ReactNode;
  product: any;
  onProductUpdated: () => void;
}

export function EditProductDialog({ children, product, onProductUpdated }: EditProductDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ManualValues>({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      title: product.title || "",
      price_cents: product.price_cents ? product.price_cents / 100 : 0,
      image_url: product.image_url || "",
      amazonUrl: product.asin ? `https://www.amazon.com/dp/${product.asin}` : "",
    },
  });

  const onSubmit = async (data: ManualValues) => {
    setIsSubmitting(true);
    try {
      let priceCents = data.price_cents;
      if (priceCents < 100 && priceCents > 0) {
        priceCents = Math.round(priceCents * 100);
      }

      await apiRequest(`/api/products/${product.id}`, {
        method: "PUT",
        body: {
          title: data.title,
          price_cents: priceCents,
          amazonUrl: data.amazonUrl || undefined,
          image_url: data.image_url || undefined,
        },
      });

      toast({
        title: "Product Updated",
        description: "Product details have been updated successfully.",
      });
      onProductUpdated();
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Update Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update the details for this product
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Product title" {...field} />
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
                  <FormLabel>Price (in dollars)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0.01" step="0.01" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the price in dollars (e.g. 29.99)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} />
                  </FormControl>
                  <FormDescription>
                    Paste a direct link to a product image
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amazonUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amazon URL (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.amazon.com/dp/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
