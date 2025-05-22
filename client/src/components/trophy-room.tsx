        import { useState, useEffect, useCallback, useMemo } from "react";
        import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
        import { format } from "date-fns";
        import { 
          Trophy, ShoppingBag, Star, Ticket as TicketIcon, 
          Pencil, Trash2, AlertTriangle, Gamepad2, Book, Shirt, 
          Gift, Utensils, Smartphone, Gem, Sparkles, Crown, 
          Layers, BadgeCheck, Upload, Loader2, Camera
        } from "lucide-react";
        import { motion, AnimatePresence } from "framer-motion";
        import { Card, CardContent } from "@/components/ui/card";
        import { 
          AlertDialog, AlertDialogAction, AlertDialogCancel, 
          AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
          AlertDialogHeader, AlertDialogTitle
        } from "@/components/ui/alert-dialog";
        import {
          Dialog,
          DialogContent,
          DialogDescription,
          DialogFooter,
          DialogHeader,
          DialogTitle,
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
        import { Badge } from "@/components/ui/badge";
        import { Button } from "@/components/ui/button";
        import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
        import { Input } from "@/components/ui/input";
        import { Textarea } from "@/components/ui/textarea";
        import { Label } from "@/components/ui/label";
        import { useToast } from "@/hooks/use-toast";
        import { useAuthStore } from "@/store/auth-store";
        import { apiRequest } from "@/lib/queryClient";
        import { cn } from "@/lib/utils";
        import { useForm } from "react-hook-form";
        import { zodResolver } from "@hookform/resolvers/zod";
        import { z } from "zod";

        // Types
        type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
        type ViewMode = 'grid' | 'timeline';

        interface TrophyItem {
          id: number;
          title: string;
          imageUrl: string;
          purchaseDate: string;
          ticketCost: number;
          transactionId: number;
          happiness?: number;
          note?: string;
          category: string;
          rarity: Rarity;
        }

        interface TrophyRoomProps {
          userId?: number;
        }

        // Form schema for trophy updates
        const trophyUpdateSchema = z.object({
          name: z.string().min(1, "Trophy name is required"),
          description: z.string().optional(),
          transaction_id: z.number(),
          user_id: z.number(),
        });

        type TrophyUpdateFormValues = z.infer<typeof trophyUpdateSchema>;

        // Constants
        const RARITY_THRESHOLDS = {
          legendary: 100,
          epic: 50,
          rare: 20,
          uncommon: 10,
        } as const;

        const CATEGORY_KEYWORDS = {
          Games: ['minecraft', 'game', 'play', 'nintendo', 'xbox', 'playstation'],
          Toys: ['lego', 'toy', 'figure', 'doll', 'puzzle'],
          Books: ['book', 'comic', 'read', 'novel', 'story'],
          Electronics: ['phone', 'tablet', 'computer', 'tech', 'device'],
          Clothing: ['shirt', 'shoes', 'wear', 'clothes', 'jacket'],
          Treats: ['candy', 'snack', 'food', 'chocolate', 'sweet'],
        } as const;

        // Helper functions
        const getRarity = (ticketCost: number): Rarity => {
          if (ticketCost >= RARITY_THRESHOLDS.legendary) return 'legendary';
          if (ticketCost >= RARITY_THRESHOLDS.epic) return 'epic';
          if (ticketCost >= RARITY_THRESHOLDS.rare) return 'rare';
          if (ticketCost >= RARITY_THRESHOLDS.uncommon) return 'uncommon';
          return 'common';
        };

        const guessCategory = (title: string): string => {
          const lowerTitle = title.toLowerCase();

          for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            if (keywords.some(keyword => lowerTitle.includes(keyword))) {
              return category;
            }
          }

          return 'Miscellaneous';
        };

        const parseMetadata = (metadata: any): { customImageUrl?: string; description?: string } => {
          if (!metadata) return {};

          try {
            const parsed = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            return {
              customImageUrl: parsed.custom_image_url,
              description: parsed.description || '',
            };
          } catch (error) {
            console.error('Failed to parse metadata:', error);
            return {};
          }
        };

        // Component icons
        const getCategoryIcon = (category: string) => {
          const iconMap: Record<string, JSX.Element> = {
            Games: <Gamepad2 className="h-5 w-5" />,
            Toys: <Gift className="h-5 w-5" />,
            Books: <Book className="h-5 w-5" />,
            Electronics: <Smartphone className="h-5 w-5" />,
            Clothing: <Shirt className="h-5 w-5" />,
            Treats: <Utensils className="h-5 w-5" />,
          };

          return iconMap[category] || <Layers className="h-5 w-5" />;
        };

        const getRarityIcon = (rarity: Rarity) => {
          const iconMap: Record<Rarity, JSX.Element> = {
            legendary: <Crown className="h-4 w-4 mr-1" />,
            epic: <Gem className="h-4 w-4 mr-1" />,
            rare: <Sparkles className="h-4 w-4 mr-1" />,
            uncommon: <Star className="h-4 w-4 mr-1" />,
            common: <BadgeCheck className="h-4 w-4 mr-1" />,
          };

          return iconMap[rarity];
        };

        const getRarityColorClass = (rarity: Rarity) => {
          const colorMap: Record<Rarity, string> = {
            legendary: "border-amber-400 bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900",
            epic: "border-purple-400 bg-gradient-to-b from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900",
            rare: "border-blue-400 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
            uncommon: "border-green-400 bg-gradient-to-b from-green-50 to-green-100 dark:from-green-950 dark:to-green-900",
            common: "border-gray-300 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900",
          };

          return colorMap[rarity];
        };

        const getRarityBadgeClass = (rarity: Rarity) => {
          const badgeMap: Record<Rarity, string> = {
            legendary: "bg-amber-500 text-white",
            epic: "bg-purple-500 text-white",
            rare: "bg-blue-500 text-white",
            uncommon: "bg-green-500 text-white",
            common: "bg-gray-500 text-white",
          };

          return badgeMap[rarity];
        };

        const getRarityBorderClass = (rarity: Rarity) => {
          const borderMap: Record<Rarity, string> = {
            legendary: "border-l-amber-500",
            epic: "border-l-purple-500",
            rare: "border-l-blue-500",
            uncommon: "border-l-green-500",
            common: "border-l-gray-500",
          };

          return borderMap[rarity];
        };

        // Trophy Detail Modal Component
        interface TrophyDetailModalProps {
          isOpen: boolean;
          onClose: () => void;
          trophy: TrophyItem; 
          userId: number | undefined;
          onUpdate?: () => void;
        }

        function TrophyDetailModal({ isOpen, onClose, trophy, userId, onUpdate }: TrophyDetailModalProps) {
          const [selectedFile, setSelectedFile] = useState<File | null>(null);
          const [previewUrl, setPreviewUrl] = useState<string | null>(null);
          const { toast } = useToast();
          const queryClient = useQueryClient();

          const form = useForm<TrophyUpdateFormValues>({
            resolver: zodResolver(trophyUpdateSchema),
            defaultValues: {
              name: trophy?.title || "",
              description: trophy?.note || "",
              transaction_id: trophy?.transactionId || 0,
              user_id: userId || 0,
            },
          });

          const updateTrophyMutation = useMutation({
            mutationFn: async (data: TrophyUpdateFormValues & { image?: File }) => {
              const formData = new FormData();
              formData.append("transaction_id", data.transaction_id.toString());
              formData.append("name", data.name);
              formData.append("description", data.description || "");
              formData.append("user_id", data.user_id.toString());

              if (data.image) {
                formData.append("image", data.image);
              }

              return apiRequest("/api/trophies/update", {
                method: "POST",
                body: formData,
              });
            },
            onSuccess: () => {
              toast({
                title: "Trophy updated!",
                description: "Your trophy has been customized successfully.",
              });

              queryClient.invalidateQueries({ queryKey: ["/api/transactions/purchases"] });
              queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });

              onUpdate?.();
              onClose();
            },
            onError: (error: any) => {
              console.error("Trophy update error:", error);
              toast({
                title: "Error updating trophy",
                description: error.message || "There was a problem updating your trophy. Please try again.",
                variant: "destructive",
              });
            },
          });

          const handleSubmit = (values: TrophyUpdateFormValues) => {
            updateTrophyMutation.mutate({
              ...values,
              image: selectedFile || undefined,
            });
          };

          const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
              // Validate file size (max 5MB)
              if (file.size > 5 * 1024 * 1024) {
                toast({
                  title: "File too large",
                  description: "Please select an image under 5MB",
                  variant: "destructive",
                });
                return;
              }

              setSelectedFile(file);

              const reader = new FileReader();
              reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
              };
              reader.readAsDataURL(file);
            }
          };

          // Reset form when modal opens with new trophy
          useEffect(() => {
            if (isOpen && trophy) {
              form.reset({
                name: trophy.title,
                description: trophy.note || "",
                transaction_id: trophy.transactionId,
                user_id: userId || 0,
              });
              setPreviewUrl(null);
              setSelectedFile(null);
            }
          }, [isOpen, trophy, userId, form]);

          return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Customize Your Trophy</DialogTitle>
                  <DialogDescription>
                    Personalize your trophy with a custom name, description, or image.
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Trophy Name</FormLabel>
                              <FormControl>
                                <Input placeholder="My Special Trophy" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem className="mt-4">
                              <FormLabel>Description/Note</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Add a special note about this trophy..."
                                  className="h-24 resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Add a personal note about this achievement
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <Card className="overflow-hidden">
                          <div className="h-40 overflow-hidden relative">
                            <img
                              src={previewUrl || trophy?.imageUrl}
                              alt={trophy?.title}
                              className="w-full h-full object-contain object-center"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder-product.png";
                              }}
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                              <Badge className={getRarityBadgeClass(trophy.rarity)}>
                                {getRarityIcon(trophy.rarity)}
                                {trophy?.ticketCost} tickets
                              </Badge>
                            </div>
                          </div>
                        </Card>

                        <div className="space-y-3">
                          <Label htmlFor="picture" className="block text-sm font-medium">
                            Trophy Image
                          </Label>
                          <div className="grid grid-cols-1 gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full flex items-center justify-center h-10 px-4 text-base"
                              onClick={() => document.getElementById("image-upload")?.click()}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {selectedFile ? "Change Image" : "Upload Image"}
                            </Button>
                            <input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                            {selectedFile && (
                              <p className="text-xs text-gray-500 text-center">
                                {selectedFile.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="pt-4">
                      <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateTrophyMutation.isPending}
                      >
                        {updateTrophyMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Pencil className="mr-2 h-4 w-4" />
                            Save Trophy
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          );
        }

        // Main Trophy Room Component
        export function TrophyRoom({ userId }: TrophyRoomProps) {
          const { user } = useAuthStore();
          const { toast } = useToast();
          const queryClient = useQueryClient();

          // State
          const [selectedTrophy, setSelectedTrophy] = useState<TrophyItem | null>(null);
          const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
          const [view, setView] = useState<ViewMode>('grid');
          const [trophyToDelete, setTrophyToDelete] = useState<TrophyItem | null>(null);
          const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

          const targetUserId = userId || user?.id;

          // Fetch awarded trophies using the new trophy system
          const { data: trophiesResponse, isLoading: trophiesLoading } = useQuery({
            queryKey: ['trophies', targetUserId],
            queryFn: async () => {
              return await apiRequest(`/api/child/${targetUserId}/trophies`, { method: 'GET' });
            },
            enabled: !!targetUserId,
          });

          // Also fetch purchase history for backward compatibility
          const { data: purchasesData = [], isLoading: purchasesLoading } = useQuery({
            queryKey: ['/api/transactions/purchases', targetUserId],
            queryFn: async () => {
              const url = targetUserId 
                ? `/api/transactions/purchases?userId=${targetUserId}` 
                : '/api/transactions/purchases';
              return await apiRequest(url, { method: 'GET' });
            },
            enabled: !!targetUserId,
          });

          const isLoading = trophiesLoading || purchasesLoading;

          // Combine awarded trophies and purchase history
          const trophyItems: TrophyItem[] = useMemo(() => {
            const awardedTrophies = trophiesResponse?.trophies || [];
            const purchases = Array.isArray(purchasesData) ? purchasesData : [];
            
            // Transform awarded trophies
            const awardedItems: TrophyItem[] = awardedTrophies.map((trophy: any) => ({
              id: `awarded-${trophy.id}`,
              title: trophy.product.title,
              imageUrl: trophy.product.image_url || '/placeholder-product.png',
              purchaseDate: trophy.awarded_at,
              ticketCost: 0, // Awarded items don't cost tickets
              transactionId: 0,
              note: trophy.custom_note || 'Awarded by parent',
              category: guessCategory(trophy.product.title),
              rarity: 'legendary' as const, // Awarded items are special
            }));
            
            // Transform purchase history  
            const purchaseItems: TrophyItem[] = purchases.map((purchase: any) => {
              const { customImageUrl, description } = parseMetadata(purchase.metadata);
              const displayTitle = purchase.note || purchase.product?.title || 'Mystery Item';
              const ticketCost = Math.abs(purchase.delta);

              return {
                id: `purchase-${purchase.id}`,
                title: displayTitle,
                imageUrl: customImageUrl || purchase.product?.image_url || '/placeholder-product.png',
                purchaseDate: purchase.created_at,
                ticketCost,
                transactionId: purchase.id,
                note: description || '',
                category: guessCategory(displayTitle),
                rarity: getRarity(ticketCost),
              };
            });
            
            // Combine and sort by date (newest first)
            return [...awardedItems, ...purchaseItems]
              .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
          }, [trophiesResponse, purchasesData]);

          // Group trophies by category
          const trophiesByCategory = useMemo(() => {
            return trophyItems.reduce((acc, trophy) => {
              const category = trophy.category;
              if (!acc[category]) acc[category] = [];
              acc[category].push(trophy);
              return acc;
            }, {} as Record<string, TrophyItem[]>);
          }, [trophyItems]);

          // Stats calculations
          const stats = useMemo(() => {
            const totalItems = trophyItems.length;
            const totalTicketsSpent = trophyItems.reduce((sum, item) => sum + item.ticketCost, 0);
            const mostValuableItem = trophyItems.length > 0 
              ? trophyItems.reduce((prev, current) => 
                  (prev.ticketCost > current.ticketCost) ? prev : current
                ) 
              : null;

            return { totalItems, totalTicketsSpent, mostValuableItem };
          }, [trophyItems]);

          // Handlers
          const handleViewTrophy = useCallback((trophy: TrophyItem) => {
            setSelectedTrophy(trophy);
            setIsDetailViewOpen(true);
          }, []);

          const handleCloseDetail = useCallback(() => {
            setIsDetailViewOpen(false);
            setTimeout(() => setSelectedTrophy(null), 300);
          }, []);

          const handleDeleteTrophy = useCallback((trophy: TrophyItem, e: React.MouseEvent) => {
            e.stopPropagation();
            setTrophyToDelete(trophy);
            setIsDeleteDialogOpen(true);
          }, []);

          const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-product.png';
          }, []);

          // Delete mutation
          const deleteTrophyMutation = useMutation({
            mutationFn: async (transactionId: number) => {
              return apiRequest(`/api/transactions/${transactionId}`, {
                method: 'DELETE',
              });
            },
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ['/api/transactions/purchases'] });
              toast({
                title: 'Trophy deleted',
                description: 'The item has been removed from your collection',
              });
              setTrophyToDelete(null);
              setIsDeleteDialogOpen(false);
            },
            onError: (error) => {
              console.error('Failed to delete trophy:', error);
              toast({
                title: 'Error',
                description: 'Failed to delete item. Please try again.',
                variant: 'destructive',
              });
            },
          });

          const confirmDeleteTrophy = useCallback(() => {
            if (trophyToDelete) {
              deleteTrophyMutation.mutate(trophyToDelete.transactionId);
            }
          }, [trophyToDelete, deleteTrophyMutation]);

          return (
            <div className="relative space-y-6">
              {/* Header */}
              <div className="relative rounded-lg overflow-hidden mb-2">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-800 via-amber-600 to-amber-800 opacity-90" />
                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between p-6">
                  <div className="flex items-center space-x-4 mb-4 md:mb-0">
                    <div className="bg-amber-100 dark:bg-amber-800 p-3 rounded-full shadow-inner border-2 border-amber-300 dark:border-amber-500">
                      <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-300" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Trophy Gallery</h2>
                      <p className="text-amber-200 text-sm">Your personal collection of rewards and accomplishments</p>
                    </div>
                  </div>
                  <Tabs value={view} onValueChange={(value) => setView(value as ViewMode)}>
                    <TabsList className="bg-amber-100/20 border border-amber-300/30">
                      <TabsTrigger value="grid" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                        Gallery View
                      </TabsTrigger>
                      <TabsTrigger value="timeline" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                        Timeline
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="overflow-hidden border-0 shadow-md relative bg-gradient-to-br from-amber-950 to-amber-900">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300" />
                  <CardContent className="flex items-center p-6">
                    <div className="mr-4 bg-gradient-to-br from-amber-400 to-amber-600 p-3 rounded-full shadow-inner">
                      <Trophy className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-amber-200/80">Total Trophies</p>
                      <h4 className="text-2xl font-bold text-white">{stats.totalItems}</h4>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-0 shadow-md relative bg-gradient-to-br from-blue-950 to-blue-900">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-300 via-blue-200 to-blue-300" />
                  <CardContent className="flex items-center p-6">
                    <div className="mr-4 bg-gradient-to-br from-blue-400 to-blue-600 p-3 rounded-full shadow-inner">
                      <TicketIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-200/80">Tickets Invested</p>
                      <h4 className="text-2xl font-bold text-white">{stats.totalTicketsSpent}</h4>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-0 shadow-md relative bg-gradient-to-br from-purple-950 to-purple-900">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-300 via-fuchsia-200 to-purple-300" />
                  <CardContent className="flex items-center p-6">
                    <div className="mr-4 bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-full shadow-inner">
                      <Crown className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-200/80">Most Valuable</p>
                      <h4 className="text-xl font-bold truncate max-w-[180px] text-white">
                        {stats.mostValuableItem?.title || "None yet"}
                      </h4>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Content */}
              {isLoading ? (
                <div className="flex justify-center my-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500" />
                </div>
              ) : trophyItems.length === 0 ? (
                <Card className="bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700">
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                    <ShoppingBag className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      No Trophies Yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md">
                      When you spend your tickets on rewards, they'll appear here as trophies in your collection!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Grid View */}
                  {view === 'grid' && (
                    <div className="space-y-8">
                      <AnimatePresence>
                        {Object.entries(trophiesByCategory).map(([category, items]) => (
                          <motion.div
                            key={category}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                          >
                            {/* Category Header */}
                            <div className="relative">
                              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-transparent via-amber-100/50 dark:via-amber-900/30 to-transparent rounded-md">
                                <div className="bg-amber-100 dark:bg-amber-900/70 p-2 rounded-full">
                                  {getCategoryIcon(category)}
                                </div>
                                <h3 className="text-lg font-semibold">{category}</h3>
                                <div className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                  ({items.length} {items.length === 1 ? 'item' : 'items'})
                                </div>
                              </div>
                            </div>

                            {/* Items Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pl-2">
                              {items.map((trophy, index) => (
                                <motion.div
                                  key={trophy.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: index * 0.05 }}
                                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                  onClick={() => handleViewTrophy(trophy)}
                                >
                                  <Card 
                                    className={cn(
                                      "overflow-hidden cursor-pointer transition-all duration-200 relative h-full border-2",
                                      getRarityColorClass(trophy.rarity)
                                    )}
                                  >
                                    {/* Rarity Badge */}
                                    <div className="absolute top-2 right-2 z-20">
                                      <Badge className={cn(
                                        "text-xs px-2 py-1 capitalize",
                                        getRarityBadgeClass(trophy.rarity)
                                      )}>
                                        {getRarityIcon(trophy.rarity)}
                                        {trophy.rarity}
                                      </Badge>
                                    </div>

                                    <div className="relative h-44 overflow-hidden">
                                      <img 
                                        src={trophy.imageUrl} 
                                        alt={trophy.title}
                                        className="w-full h-full object-contain object-center"
                                        onError={handleImageError}
                                      />

                                      {/* Action Buttons */}
                                      <div className="absolute bottom-2 right-2 flex flex-col space-y-1">
                                        <Badge 
                                          className="bg-blue-500 hover:bg-blue-600 cursor-pointer transition-colors"
                                          onClick={(e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            handleViewTrophy(trophy);
                                          }}
                                        >
                                          <Pencil className="h-3 w-3 mr-1" />
                                          Edit
                                        </Badge>
                                        <Badge 
                                          className="bg-red-500 hover:bg-red-600 cursor-pointer transition-colors"
                                          onClick={(e) => handleDeleteTrophy(trophy, e)}
                                        >
                                          <Trash2 className="h-3 w-3 mr-1" />
                                          Delete
                                        </Badge>
                                      </div>
                                    </div>

                                    <CardContent className="p-4">
                                      <div className="flex justify-between items-center mb-1">
                                        <h3 className="font-bold truncate">{trophy.title}</h3>
                                        <Badge className="bg-amber-500 flex-shrink-0">
                                          <TicketIcon className="h-3 w-3 mr-1" />
                                          {trophy.ticketCost}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {format(new Date(trophy.purchaseDate), "MMMM d, yyyy")}
                                      </p>
                                      {trophy.note && (
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic truncate">
                                          "{trophy.note}"
                                        </p>
                                      )}
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Timeline View */}
                  {view === 'timeline' && (
                    <div className="relative border-l-2 border-amber-200 dark:border-amber-800 ml-4 pl-6 space-y-6">
                      {trophyItems
                        .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
                        .map((trophy, index) => (
                          <motion.div
                            key={trophy.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="relative"
                          >
                            {/* Timeline dot */}
                            <div className="absolute -left-10 mt-1.5">
                              <div className={cn(
                                "h-4 w-4 rounded-full border-4 border-white dark:border-gray-900",
                                getRarityBadgeClass(trophy.rarity).replace('text-white', '')
                              )} />
                            </div>

                            <Card 
                              className={cn(
                                "overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg border-l-4",
                                getRarityBorderClass(trophy.rarity)
                              )}
                              onClick={() => handleViewTrophy(trophy)}
                            >
                              <div className="flex flex-col md:flex-row">
                                <div className="md:w-1/4 h-32 md:h-auto overflow-hidden">
                                  <img 
                                    src={trophy.imageUrl} 
                                    alt={trophy.title}
                                    className="w-full h-full object-cover"
                                    onError={handleImageError}
                                  />
                                </div>
                                <div className="p-4 md:w-3/4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {format(new Date(trophy.purchaseDate), "MMMM d, yyyy")}
                                      </p>
                                      <h3 className="font-bold text-lg">{trophy.title}</h3>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewTrophy(trophy);
                                        }}
                                      >
                                        <Pencil className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteTrophy(trophy, e);
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge className={getRarityBadgeClass(trophy.rarity)}>
                                      {getRarityIcon(trophy.rarity)}
                                      {trophy.rarity}
                                    </Badge>
                                    <Badge className="bg-amber-500">
                                      <TicketIcon className="h-3 w-3 mr-1" />
                                      {trophy.ticketCost} tickets
                                    </Badge>
                                    <Badge variant="outline">
                                      {getCategoryIcon(trophy.category)}
                                      {trophy.category}
                                    </Badge>
                                  </div>
                                  {trophy.note && (
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                                      "{trophy.note}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        ))}
                    </div>
                  )}
                </>
              )}

              {/* Detail Modal */}
              {selectedTrophy && (
                <TrophyDetailModal
                  isOpen={isDetailViewOpen}
                  onClose={handleCloseDetail}
                  trophy={selectedTrophy}
                  userId={targetUserId}
                  onUpdate={() => {
                    // Refresh the list after update
                    queryClient.invalidateQueries({ queryKey: ['/api/transactions/purchases'] });
                  }}
                />
              )}

              {/* Delete Confirmation Dialog */}
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center text-red-600">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Delete Trophy
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this trophy? This action cannot be undone.
                      {trophyToDelete && (
                        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                          <p className="font-medium">{trophyToDelete.title}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(trophyToDelete.purchaseDate), "MMMM d, yyyy")}
                          </p>
                          <p className="text-sm text-amber-600">{trophyToDelete.ticketCost} tickets</p>
                        </div>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => setTrophyToDelete(null)}
                      disabled={deleteTrophyMutation.isPending}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={confirmDeleteTrophy}
                      disabled={deleteTrophyMutation.isPending}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {deleteTrophyMutation.isPending ? (
                        <>
                          <span className="animate-spin mr-2">⟳</span>
                          Deleting...
                        </>
                      ) : (
                        "Delete Trophy"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        }