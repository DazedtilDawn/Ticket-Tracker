import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/store/auth-store";
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

const searchSchema = z.object({
  amazonUrl: z.string().url({
    message: "Please enter a valid Amazon product URL",
  }),
});

const manualSchema = z.object({
  title: z.string().min(1, { message: "Product title is required" }),
  priceCents: z.coerce.number()
    .int({ message: "Price must be a whole number" })
    .min(1, { message: "Price must be greater than 0" }),
  imageUrl: z.string().url({ message: "Image URL must be valid" }).optional().or(z.literal("")),
  amazonUrl: z.string().url({ message: "Amazon URL must be valid" }).optional().or(z.literal("")),
});

const goalSchema = z.object({
  userId: z.number().int().positive(),
  productId: z.number().int().positive(),
});

type SearchValues = z.infer<typeof searchSchema>;
type ManualValues = z.infer<typeof manualSchema>;
type GoalValues = z.infer<typeof goalSchema>;

interface AddProductDialogProps {
  children: React.ReactNode;
  onProductAdded: () => void;
}

export function AddProductDialog({ children, onProductAdded }: AddProductDialogProps) {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isManualCreating, setIsManualCreating] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("amazon");
  
  const searchForm = useForm<SearchValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      amazonUrl: "",
    },
  });
  
  const manualForm = useForm<ManualValues>({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      title: "",
      priceCents: 0,
      imageUrl: "",
      amazonUrl: "",
    }
  });
  
  const goalForm = useForm<GoalValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      userId: user?.id,
      productId: 0,
    },
  });
  
  const handleSearch = async (data: SearchValues) => {
    setIsSearching(true);
    setSearchResult(null);
    
    try {
      const result = await apiRequest("/api/products/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      setSearchResult(result);
      
      // Update goal form with product ID
      goalForm.setValue("product_id", result.id);
    } catch (error) {
      toast({
        title: "Search Error",
        description: error.message || "Failed to find product details",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleManualCreate = async (data: ManualValues) => {
    setIsManualCreating(true);
    
    try {
      // Convert price from dollars to cents if needed
      let priceCents = data.priceCents;
      if (priceCents < 100 && priceCents > 0) {
        priceCents = Math.round(priceCents * 100);
      }
      
      // Prepare request data
      const requestData = {
        title: data.title,
        priceCents: priceCents,
        amazonUrl: data.amazonUrl || undefined,
        imageUrl: data.imageUrl || undefined
      };
      
      console.log("Sending manual product data:", requestData);

      const result = await apiRequest("/api/products/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });
      
      if (result.alreadyExists) {
        if (result.wasUpdated) {
          toast({
            title: "Product Updated",
            description: "An existing product was found and updated with your details.",
          });
        } else {
          toast({
            title: "Product Found",
            description: "A similar product already exists in the system and will be used.",
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
      
      // Update goal form with product ID
      goalForm.setValue("product_id", result.id);
      
      // Switch to the product display section
      setActiveTab("preview");
    } catch (error) {
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
        })
      });
      
      toast({
        title: "Goal Added",
        description: "Product has been added to your wishlist!",
      });
      
      onProductAdded();
      setOpen(false);
      setSearchResult(null);
      searchForm.reset();
      manualForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to add product to wishlist",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  // Format price in dollars
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add a Product</DialogTitle>
          <DialogDescription>
            Add a product to your wishlist using Amazon or manual entry
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="amazon" className="flex-1">Amazon Link</TabsTrigger>
            <TabsTrigger value="manual" className="flex-1">Manual Entry</TabsTrigger>
            {searchResult && <TabsTrigger value="preview" className="flex-1">Product</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="amazon" className="mt-4">
            <Form {...searchForm}>
              <form onSubmit={searchForm.handleSubmit(handleSearch)} className="space-y-4">
                <FormField
                  control={searchForm.control}
                  name="amazonUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amazon Product URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://www.amazon.com/dp/B07..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Paste the full Amazon product URL
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={isSearching} className="w-full">
                  {isSearching ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </span>
                  ) : "Search Product"}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="manual" className="mt-4">
            <Form {...manualForm}>
              <form onSubmit={manualForm.handleSubmit(handleManualCreate)} className="space-y-4">
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
                  name="priceCents"
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
                  name="imageUrl"
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
                
                <Button type="submit" disabled={isManualCreating} className="w-full">
                  {isManualCreating ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Product...
                    </span>
                  ) : "Create Product"}
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
                      src={searchResult.image_url || "https://placehold.co/100x100/e5e7eb/a1a1aa?text=No+Image"} 
                      alt={searchResult.title} 
                      className="w-20 h-20 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/100x100/e5e7eb/a1a1aa?text=Image+Error";
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{searchResult.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Price: {formatPrice(searchResult.price_cents)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Tickets required: {Math.ceil(searchResult.price_cents / 25)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Form {...goalForm}>
                  <form onSubmit={goalForm.handleSubmit(handleAddGoal)}>
                    <input type="hidden" {...goalForm.register("product_id")} />
                    <input type="hidden" {...goalForm.register("user_id")} />
                    
                    <div className="flex justify-end mt-4">
                      <Button type="submit" disabled={isCreating} className="w-full">
                        {isCreating ? (
                          <span className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </span>
                        ) : "Add to Wishlist"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
