import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { TICKET_CENT_VALUE } from "../../../config/business";
import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/store/auth-store";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const manualSchema = z.object({
  title: z.string().min(1, { message: "Product title is required" }),
  price_cents: z.coerce
    .number()
    .min(1, { message: "Price must be greater than 0" }),
  image_url: z
    .string()
    .url({ message: "Image URL must be valid" })
    .optional()
    .or(z.literal("")),
  amazonUrl: z
    .string()
    .url({ message: "Amazon URL must be valid" })
    .optional()
    .or(z.literal("")),
});

const goalSchema = z.object({
  user_id: z.number().int().positive(),
  product_id: z.number().int().positive(),
});

type ManualValues = z.infer<typeof manualSchema>;
type GoalValues = z.infer<typeof goalSchema>;

interface AddProductDialogProps {
  children: React.ReactNode;
  onProductAdded: () => void;
}

export function AddProductDialog({
  children,
  onProductAdded,
}: AddProductDialogProps) {
  const { toast } = useToast();
  const { user, getChildUsers, isViewingAsChild } = useAuthStore();
  const viewingAsChild = isViewingAsChild();
  const childUsers = getChildUsers();
  const isParent = user?.role === "parent" && !viewingAsChild;
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isManualCreating, setIsManualCreating] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("manual");
  const [selectedChildIds, setSelectedChildIds] = useState<number[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  const manualForm = useForm<ManualValues>({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      title: "",
      price_cents: 0,
      image_url: "",
      amazonUrl: "",
    },
  });

  const goalForm = useForm<GoalValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      user_id: user?.id,
      product_id: 0,
    },
  });

  const handleManualCreate = async (data: ManualValues) => {
    setIsManualCreating(true);

    try {
      // Always convert price from dollars to cents
      const priceCents = Math.round(data.price_cents * 100);

      // Prepare request data
      const requestData = {
        title: data.title,
        price_cents: priceCents,
        amazonUrl: data.amazonUrl || undefined,
        image_url: data.image_url || undefined,
      };

      console.log("Sending manual product data:", requestData);

      const result = await apiRequest("/api/products/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (result.alreadyExists) {
        if (result.wasUpdated) {
          toast({
            title: "Product Updated",
            description:
              "An existing product was found and updated with your details.",
          });
        } else {
          toast({
            title: "Product Found",
            description:
              "A similar product already exists in the system and will be used.",
          });
        }
      } else {
        toast({
          title: "Product Created",
          description: "Your product has been successfully created.",
        });
      }

      // Set search result to the newly created product
      setSearchResult(result);

      onProductAdded();

      // Update goal form with product ID
      goalForm.setValue("product_id", result.id);

      // Switch to the product display section
      setActiveTab("preview");
    } catch (error: any) {
      toast({
        title: "Creation Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setIsManualCreating(false);
    }
  };

  const handleAddGoal = async (data: GoalValues) => {
    setIsCreating(true);

    try {
      await apiRequest("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          user_id: user?.id, // Ensure using current user ID
        }),
      });

      toast({
        title: "Goal Added",
        description: "Product has been added to your wishlist!",
      });

      onProductAdded();
      setOpen(false);
      setSearchResult(null);
      manualForm.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add product to wishlist",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleChildSelection = (id: number, checked: boolean) => {
    setSelectedChildIds((prev) =>
      checked ? [...prev, id] : prev.filter((c) => c !== id),
    );
  };

  const handleAssignToChildren = async () => {
    if (!searchResult) return;
    setIsAssigning(true);
    try {
      await Promise.all(
        selectedChildIds.map((childId) =>
          apiRequest("/api/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: childId,
              product_id: searchResult.id,
            }),
          }),
        ),
      );

      toast({
        title: "Wishlists Updated",
        description: "Product added to selected wishlists.",
      });

      onProductAdded();
      setOpen(false);
      setSearchResult(null);
      manualForm.reset();
      setSelectedChildIds([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add to wishlists",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Format price in dollars
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add a Product</DialogTitle>
          <DialogDescription>
            Add a product to your wishlist manually
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full pt-2"
        >
          <TabsList className="w-full">
            <TabsTrigger value="manual" className="flex-1">
              Manual Entry
            </TabsTrigger>
            {searchResult && (
              <TabsTrigger value="preview" className="flex-1">
                Product
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="manual" className="mt-4">
            <Form {...manualForm}>
              <form
                onSubmit={manualForm.handleSubmit(handleManualCreate)}
                className="space-y-4"
              >
                <FormField
                  control={manualForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nintendo Switch Console"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={manualForm.control}
                  name="price_cents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (in dollars)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="29.99"
                          min="0.01"
                          step="0.01"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the price in dollars (e.g. 29.99)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={manualForm.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/image.jpg"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Paste a direct link to a product image
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={manualForm.control}
                  name="amazonUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amazon URL (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://www.amazon.com/dp/..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional: Amazon URL if you have it
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isManualCreating}
                  className="w-full"
                >
                  {isManualCreating ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Product...
                    </span>
                  ) : (
                    "Create Product"
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            {searchResult && (
              <>
                <Card>
                  <CardContent className="p-4 flex items-center space-x-4">
                    <img
                      src={
                        searchResult.image_url ||
                        "https://placehold.co/100x100/e5e7eb/a1a1aa?text=No+Image"
                      }
                      alt={searchResult.title}
                      className="w-20 h-20 object-contain"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://placehold.co/100x100/e5e7eb/a1a1aa?text=Image+Error";
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">
                        {searchResult.title}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Price: {formatPrice(searchResult.price_cents)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Tickets required:{" "}
                        {Math.ceil(
                          searchResult.price_cents / TICKET_CENT_VALUE,
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {isParent ? (
                  <div className="mt-4 space-y-2">
                    {childUsers.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No child accounts found.
                      </p>
                    ) : (
                      childUsers.map((child) => (
                        <label
                          key={child.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            checked={selectedChildIds.includes(child.id)}
                            onCheckedChange={(c) =>
                              toggleChildSelection(child.id, !!c)
                            }
                          />
                          <span>{child.name}</span>
                        </label>
                      ))
                    )}
                    <div className="flex justify-end">
                      <Button
                        onClick={handleAssignToChildren}
                        disabled={isAssigning || selectedChildIds.length === 0}
                        className="mt-2"
                      >
                        {isAssigning ? (
                          <span className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </span>
                        ) : (
                          "Add to Selected Wishlists"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Form {...goalForm}>
                    <form onSubmit={goalForm.handleSubmit(handleAddGoal)}>
                      <input
                        type="hidden"
                        {...goalForm.register("product_id")}
                      />
                      <input type="hidden" {...goalForm.register("user_id")} />

                      <div className="flex justify-end mt-4">
                        <Button
                          type="submit"
                          disabled={isCreating}
                          className="w-full"
                        >
                          {isCreating ? (
                            <span className="flex items-center justify-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </span>
                          ) : (
                            "Add to Wishlist"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
