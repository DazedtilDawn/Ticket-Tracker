import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Trophy, ShoppingBag, Star, Ticket as TicketIcon, 
  Pencil, Trash2, AlertTriangle, Gamepad2, Book, Shirt, 
  Gift, Utensils, Smartphone, Gem, Sparkles, Crown, 
  Layers, BadgeCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { TrophyDetailModal } from "@/components/trophy-detail-modal";

// Types
type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
type ViewMode = 'grid' | 'list';

interface AchievementItem {
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

interface AchievementShowcaseProps {
  userId?: number;
}

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

export function AchievementShowcase({ userId }: AchievementShowcaseProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementItem | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [happinessRatings, setHappinessRatings] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [view, setView] = useState<ViewMode>('grid');
  const [achievementToDelete, setAchievementToDelete] = useState<AchievementItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const targetUserId = userId || user?.id;

  // Fetch purchase history
  const { data: purchasesData = [], isLoading } = useQuery({
    queryKey: ['/api/transactions/purchases', targetUserId],
    queryFn: async () => {
      const url = targetUserId 
        ? `/api/transactions/purchases?userId=${targetUserId}` 
        : '/api/transactions/purchases';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch purchases');
      return response.json();
    },
    enabled: !!targetUserId,
  });

  // Transform purchases into achievement items
  const achievementItems: AchievementItem[] = useMemo(() => {
    const purchases = Array.isArray(purchasesData) ? purchasesData : [];

    return purchases.map((purchase: any) => {
      const { customImageUrl, description } = parseMetadata(purchase.metadata);
      const displayTitle = purchase.note || purchase.product?.title || 'Mystery Item';
      const ticketCost = Math.abs(purchase.delta);

      return {
        id: purchase.id,
        title: displayTitle,
        imageUrl: customImageUrl || purchase.product?.image_url || '/placeholder-product.png',
        purchaseDate: purchase.created_at,
        ticketCost,
        transactionId: purchase.id,
        happiness: happinessRatings[purchase.id] || 0,
        note: notes[purchase.id] || description || '',
        category: guessCategory(displayTitle),
        rarity: getRarity(ticketCost),
      };
    });
  }, [purchasesData, happinessRatings, notes]);

  // Group achievements by category
  const achievementsByCategory = useMemo(() => {
    return achievementItems.reduce((acc, achievement) => {
      const category = achievement.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(achievement);
      return acc;
    }, {} as Record<string, AchievementItem[]>);
  }, [achievementItems]);

  // Stats calculations
  const stats = useMemo(() => {
    const totalItems = achievementItems.length;
    const totalTicketsSpent = achievementItems.reduce((sum, item) => sum + item.ticketCost, 0);
    const mostValuableAchievement = achievementItems.length > 0 
      ? achievementItems.reduce((prev, current) => 
          (prev.ticketCost > current.ticketCost) ? prev : current
        ) 
      : null;

    return { totalItems, totalTicketsSpent, mostValuableAchievement };
  }, [achievementItems]);

  // Handlers
  const handleViewAchievement = useCallback((achievement: AchievementItem) => {
    setSelectedAchievement(achievement);
    setIsDetailViewOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailViewOpen(false);
    setTimeout(() => setSelectedAchievement(null), 300);
  }, []);

  const handleDeleteAchievement = useCallback((achievement: AchievementItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setAchievementToDelete(achievement);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = '/placeholder-product.png';
  }, []);

  // Delete mutation
  const deleteAchievementMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      return apiRequest(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/purchases'] });
      toast({
        title: 'Achievement deleted',
        description: 'The item has been removed from your collection',
      });
      setAchievementToDelete(null);
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      console.error('Failed to delete achievement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete item. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const confirmDeleteAchievement = useCallback(() => {
    if (achievementToDelete) {
      deleteAchievementMutation.mutate(achievementToDelete.transactionId);
    }
  }, [achievementToDelete, deleteAchievementMutation]);

  // Load saved data from localStorage
  useEffect(() => {
    try {
      const savedRatings = JSON.parse(localStorage.getItem('achievementHappinessRatings') || '{}');
      const savedNotes = JSON.parse(localStorage.getItem('achievementNotes') || '{}');
      setHappinessRatings(savedRatings);
      setNotes(savedNotes);
    } catch (error) {
      console.error('Failed to load saved achievement data:', error);
    }
  }, []);

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
              <h2 className="text-2xl font-bold text-white">Achievement Gallery</h2>
              <p className="text-amber-200 text-sm">Your personal collection of rewards and accomplishments</p>
            </div>
          </div>
          <Tabs value={view} onValueChange={(value) => setView(value as ViewMode)}>
            <TabsList className="bg-amber-100/20 border border-amber-300/30">
              <TabsTrigger value="grid" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                Gallery View
              </TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                List View
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
              <p className="text-sm text-amber-200/80">Total Achievements</p>
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
                {stats.mostValuableAchievement?.title || "None yet"}
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
      ) : achievementItems.length === 0 ? (
        <Card className="bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <ShoppingBag className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Achievements Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              When you spend your tickets on rewards, they'll appear here as achievements in your collection!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <AnimatePresence>
            {Object.entries(achievementsByCategory).map(([category, items]) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="achievement-category space-y-4"
              >
                {/* Category Header */}
                <div className="category-header relative">
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

                {/* Grid View */}
                {view === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pl-2">
                    {items.map((achievement, index) => (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        onClick={() => handleViewAchievement(achievement)}
                      >
                        <Card 
                          className={cn(
                            "overflow-hidden cursor-pointer transition-all duration-200 relative h-full border-2",
                            getRarityColorClass(achievement.rarity)
                          )}
                        >
                          {/* Rarity Badge */}
                          <div className="absolute top-2 right-2 z-20">
                            <Badge className={cn(
                              "text-xs px-2 py-1 capitalize",
                              getRarityBadgeClass(achievement.rarity)
                            )}>
                              {getRarityIcon(achievement.rarity)}
                              {achievement.rarity}
                            </Badge>
                          </div>

                          <div className="relative h-44 overflow-hidden">
                            <img 
                              src={achievement.imageUrl} 
                              alt={achievement.title}
                              className="w-full h-full object-contain object-center"
                              onError={handleImageError}
                            />

                            {/* Action Buttons */}
                            <div className="absolute bottom-2 right-2 flex flex-col space-y-1">
                              <Badge 
                                className="bg-blue-500 hover:bg-blue-600 cursor-pointer transition-colors"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  handleViewAchievement(achievement);
                                }}
                              >
                                <Pencil className="h-3 w-3 mr-1" />
                                Edit
                              </Badge>
                              <Badge 
                                className="bg-red-500 hover:bg-red-600 cursor-pointer transition-colors"
                                onClick={(e) => handleDeleteAchievement(achievement, e)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Badge>
                            </div>
                          </div>

                          <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-1">
                              <h3 className="font-bold truncate">{achievement.title}</h3>
                              <Badge className="bg-amber-500 flex-shrink-0">
                                <TicketIcon className="h-3 w-3 mr-1" />
                                {achievement.ticketCost}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {format(new Date(achievement.purchaseDate), "MMMM d, yyyy")}
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  // List View
                  <div className="space-y-2 pl-2">
                    {items.map((achievement, index) => (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <Card 
                          className={cn(
                            "overflow-hidden cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4",
                            getRarityBorderClass(achievement.rarity)
                          )}
                          onClick={() => handleViewAchievement(achievement)}
                        >
                          <CardContent className="p-4 flex items-center">
                            <div className="h-16 w-16 rounded-md overflow-hidden mr-4 flex-shrink-0">
                              <img 
                                src={achievement.imageUrl} 
                                alt={achievement.title}
                                className="h-full w-full object-cover"
                                onError={handleImageError}
                              />
                            </div>
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center flex-wrap gap-2">
                                <h4 className="font-medium truncate">{achievement.title}</h4>
                                <Badge className={cn(
                                  "text-xs",
                                  getRarityBadgeClass(achievement.rarity)
                                )}>
                                  {achievement.rarity}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {format(new Date(achievement.purchaseDate), "MMMM d, yyyy")} • {achievement.ticketCost} tickets
                              </p>
                            </div>
                            <div className="flex-shrink-0 ml-2 space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="px-2 py-1 h-auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewAchievement(achievement);
                                }}
                              >
                                <Pencil className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="px-2 py-1 h-auto text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAchievement(achievement, e);
                                }}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Modal */}
      {selectedAchievement && (
        <TrophyDetailModal
          isOpen={isDetailViewOpen}
          onClose={handleCloseDetail}
          trophy={selectedAchievement}
          userId={targetUserId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Delete Achievement
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this achievement? This action cannot be undone.
              {achievementToDelete && (
                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <p className="font-medium">{achievementToDelete.title}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(achievementToDelete.purchaseDate), "MMMM d, yyyy")}
                  </p>
                  <p className="text-sm text-amber-600">{achievementToDelete.ticketCost} tickets</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setAchievementToDelete(null)}
              disabled={deleteAchievementMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteAchievement}
              disabled={deleteAchievementMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteAchievementMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Deleting...
                </>
              ) : (
                "Delete Achievement"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}