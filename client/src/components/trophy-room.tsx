import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Trophy, ShoppingBag, Star, HeartHandshake, Sparkles, Ticket as TicketIcon, 
  Edit, Pencil, Trash2, AlertTriangle, Award, Gamepad2, Book, Shirt, 
  Gift, Utensils, Smartphone, Gem, Zap, Crown, BadgeCheck, Layers
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { TrophyDetailModal } from "@/components/trophy-detail-modal";

// Types for our trophy items
interface TrophyItem {
  id: number;
  title: string;
  imageUrl: string;
  purchaseDate: string;
  ticketCost: number;
  transactionId: number;
  happiness?: number; // Optional happiness rating
  note?: string; // Optional note from the child
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'; // Rarity category
  category?: string; // Product category (e.g., "Games", "Toys", "Electronics")
}

export function TrophyRoom({ userId }: { userId?: number }) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTrophy, setSelectedTrophy] = useState<TrophyItem | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [happinessRatings, setHappinessRatings] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [view, setView] = useState<'grid' | 'timeline'>('grid');
  const [trophyToDelete, setTrophyToDelete] = useState<TrophyItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isManageMode, setIsManageMode] = useState(false);

  // Use userId from props if provided, otherwise use the logged-in user
  const targetUserId = userId || user?.id;
  
  // Helper function to determine rarity based on ticket cost
  const getRarity = (ticketCost: number): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' => {
    if (ticketCost >= 100) return 'legendary';
    if (ticketCost >= 50) return 'epic';
    if (ticketCost >= 20) return 'rare';
    if (ticketCost >= 10) return 'uncommon';
    return 'common';
  };
  
  // Helper function to guess category based on product title
  const guessCategory = (title: string): string => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('minecraft') || lowerTitle.includes('game') || lowerTitle.includes('play')) 
      return 'Games';
    if (lowerTitle.includes('lego') || lowerTitle.includes('toy') || lowerTitle.includes('figure')) 
      return 'Toys';
    if (lowerTitle.includes('book') || lowerTitle.includes('comic') || lowerTitle.includes('read')) 
      return 'Books';
    if (lowerTitle.includes('phone') || lowerTitle.includes('tablet') || lowerTitle.includes('computer')) 
      return 'Electronics';
    if (lowerTitle.includes('shirt') || lowerTitle.includes('shoes') || lowerTitle.includes('wear')) 
      return 'Clothing';
    if (lowerTitle.includes('candy') || lowerTitle.includes('snack') || lowerTitle.includes('food')) 
      return 'Treats';
    return 'Misc';
  };

  // Fetch purchase history
  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['/api/transactions/purchases', targetUserId],
    enabled: !!targetUserId, // Only run when we have a target user ID
  });

  // Transform purchases into trophy items
  const trophyItems: TrophyItem[] = purchases.map((purchase: any) => {
    // Try to get custom image URL from metadata if it exists
    let customImageUrl = undefined;
    
    // Handle both string and object metadata formats
    if (purchase.metadata) {
      if (typeof purchase.metadata === 'string') {
        try {
          const metadata = JSON.parse(purchase.metadata);
          customImageUrl = metadata.custom_image_url;
        } catch (error) {
          console.log(`Failed to parse string metadata for trophy ${purchase.id}:`, error);
        }
      } else if (typeof purchase.metadata === 'object') {
        // Already an object, no need to parse
        customImageUrl = purchase.metadata.custom_image_url;
      }
    }
    
    // If trophy has a note but no custom name, use that as the title
    const displayTitle = purchase.note || purchase.product?.title || 'Mystery Item';
    
    // Determine trophy category and rarity
    const ticketCost = Math.abs(purchase.delta);
    const category = guessCategory(displayTitle);
    const rarity = getRarity(ticketCost);
    
    return {
      id: purchase.id,
      title: displayTitle,
      imageUrl: customImageUrl || purchase.product?.image_url || '/placeholder-product.png',
      purchaseDate: purchase.created_at,
      ticketCost: ticketCost,
      transactionId: purchase.id,
      happiness: happinessRatings[purchase.id] || 0,
      note: notes[purchase.id] || '',
      category: category,
      rarity: rarity
    };
  });

  // View trophy details with customization options
  const handleViewTrophy = (trophy: TrophyItem) => {
    setSelectedTrophy(trophy);
    setIsDetailViewOpen(true);
  };

  // Close detail view
  const handleCloseDetail = () => {
    setIsDetailViewOpen(false);
    setTimeout(() => setSelectedTrophy(null), 300); // Wait for animation to complete
  };
  
  // Delete trophy mutation
  const deleteTrophyMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      const response = await apiRequest(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/purchases'] });
      toast({
        title: 'Trophy deleted',
        description: 'The trophy has been removed from your collection',
        variant: 'default',
      });
      setTrophyToDelete(null);
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      console.error('Failed to delete trophy:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete trophy. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  // Open delete confirmation dialog
  const handleDeleteTrophy = (trophy: TrophyItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setTrophyToDelete(trophy);
    setIsDeleteDialogOpen(true);
  };

  // Functions moved to TrophyDetailModal component
  
  // For backward compatibility
  const handleSetHappiness = (trophyId: number, rating: number) => {
    setHappinessRatings(prev => ({
      ...prev,
      [trophyId]: rating
    }));
  };

  // For backward compatibility
  const handleSaveNote = (trophyId: number, note: string) => {
    setNotes(prev => ({
      ...prev,
      [trophyId]: note
    }));
  };
  
  // Confirm trophy deletion
  const confirmDeleteTrophy = () => {
    if (trophyToDelete) {
      deleteTrophyMutation.mutate(trophyToDelete.transactionId);
    }
  };

  // Load saved happiness ratings and notes from localStorage
  useEffect(() => {
    try {
      const savedRatings = JSON.parse(localStorage.getItem('trophyHappinessRatings') || '{}');
      const savedNotes = JSON.parse(localStorage.getItem('trophyNotes') || '{}');
      setHappinessRatings(savedRatings);
      setNotes(savedNotes);
    } catch (error) {
      console.error('Failed to load saved trophy data:', error);
    }
  }, []);

  // Generate trophy stats
  const totalPurchases = trophyItems.length;
  const totalTicketsSpent = trophyItems.reduce((sum, item) => sum + item.ticketCost, 0);
  const mostExpensiveItem = trophyItems.length > 0 
    ? trophyItems.reduce((prev, current) => (prev.ticketCost > current.ticketCost) ? prev : current) 
    : null;
  const recentPurchase = trophyItems.length > 0 
    ? [...trophyItems].sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())[0]
    : null;

  return (
    <div className="relative">
      <div className="flex flex-col space-y-4">
        {/* Custom banner header with premium feel */}
        <div className="relative rounded-lg overflow-hidden mb-2">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-800 via-amber-600 to-amber-800 opacity-90"></div>
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between p-6">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="bg-amber-100 dark:bg-amber-800 p-3 rounded-full shadow-inner border-2 border-amber-300 dark:border-amber-500">
                <Crown className="h-6 w-6 text-amber-600 dark:text-amber-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Achievement Gallery</h2>
                <p className="text-amber-200 text-sm">Your personal collection of rewards and accomplishments</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Tabs defaultValue="grid" value={view} onValueChange={(value) => setView(value as 'grid' | 'timeline')}>
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
        </div>

        {isLoading ? (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : trophyItems.length === 0 ? (
          <Card className="bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
              <ShoppingBag className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Purchases Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                When you spend your tickets on rewards, they'll appear here as trophies in your collection!
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Trophy Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800">
                <CardContent className="p-4 flex items-center">
                  <div className="bg-amber-100 dark:bg-amber-900/50 p-3 rounded-full mr-4">
                    <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-amber-800 dark:text-amber-300">Total Rewards</p>
                    <h4 className="text-2xl font-bold text-amber-900 dark:text-amber-200">{totalPurchases}</h4>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800">
                <CardContent className="p-4 flex items-center">
                  <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full mr-4">
                    <TicketIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-800 dark:text-blue-300">Tickets Spent</p>
                    <h4 className="text-2xl font-bold text-blue-900 dark:text-blue-200">{totalTicketsSpent}</h4>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800">
                <CardContent className="p-4 flex items-center">
                  <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-full mr-4">
                    <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-800 dark:text-purple-300">
                      {mostExpensiveItem ? "Most Valuable" : "No Rewards Yet"}
                    </p>
                    {mostExpensiveItem && (
                      <h4 className="text-lg font-bold text-purple-900 dark:text-purple-200 truncate max-w-[200px]">
                        {mostExpensiveItem.title}
                      </h4>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Grid View with Category Sections */}
            {view === 'grid' && (
              <div className="space-y-8">
                {/* Group trophies by category */}
                {Object.entries(
                  trophyItems.reduce((acc, trophy) => {
                    const category = trophy.category || 'Miscellaneous';
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(trophy);
                    return acc;
                  }, {} as Record<string, TrophyItem[]>)
                ).map(([category, categoryTrophies]) => (
                  <div key={category} className="space-y-4">
                    {/* Category Banner */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r 
                        from-transparent 
                        via-amber-600/20
                        to-transparent 
                        rounded-md">
                      </div>
                      <div className="relative flex items-center p-2 pl-4">
                        {category === 'Games' && <Gamepad2 className="h-5 w-5 text-amber-500 mr-2" />}
                        {category === 'Toys' && <Gift className="h-5 w-5 text-amber-500 mr-2" />}
                        {category === 'Books' && <Book className="h-5 w-5 text-amber-500 mr-2" />}
                        {category === 'Electronics' && <Smartphone className="h-5 w-5 text-amber-500 mr-2" />}
                        {category === 'Clothing' && <Shirt className="h-5 w-5 text-amber-500 mr-2" />}
                        {category === 'Treats' && <Utensils className="h-5 w-5 text-amber-500 mr-2" />}
                        {category === 'Miscellaneous' && <Award className="h-5 w-5 text-amber-500 mr-2" />}
                        <h3 className="text-lg font-semibold">{category}</h3>
                        <div className="ml-3 h-px bg-amber-200/50 flex-grow"></div>
                      </div>
                    </div>
                    
                    {/* Category Trophies Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pl-4">
                      {categoryTrophies.map((trophy) => (
                        <motion.div
                          key={trophy.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ y: -5, transition: { duration: 0.2 } }}
                          onClick={() => handleViewTrophy(trophy)}
                        >
                    {/* Dynamic card styling based on trophy rarity */}
                    <Card 
                      className={cn(
                        "overflow-hidden cursor-pointer transition-all duration-200 relative h-full",
                        trophy.rarity === 'legendary' && "border-2 border-amber-500 shadow-lg shadow-amber-200 dark:shadow-amber-900/30",
                        trophy.rarity === 'epic' && "border-2 border-purple-500 shadow-md shadow-purple-200 dark:shadow-purple-900/30",
                        trophy.rarity === 'rare' && "border-2 border-blue-500 shadow-md shadow-blue-200 dark:shadow-blue-900/30", 
                        trophy.rarity === 'uncommon' && "border-2 border-green-500 shadow-sm shadow-green-200 dark:shadow-green-900/30",
                        trophy.rarity === 'common' && "border border-gray-300 dark:border-gray-700"
                      )}
                    >
                      {/* Rarity indicator */}
                      <div className={cn(
                        "absolute top-0 left-0 right-0 h-1 z-10",
                        trophy.rarity === 'legendary' && "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400",
                        trophy.rarity === 'epic' && "bg-gradient-to-r from-purple-400 via-fuchsia-300 to-purple-400",
                        trophy.rarity === 'rare' && "bg-gradient-to-r from-blue-400 to-indigo-400",
                        trophy.rarity === 'uncommon' && "bg-gradient-to-r from-green-400 to-emerald-400",
                        trophy.rarity === 'common' && "bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700"
                      )} />
                      
                      {/* Category icon badge */}
                      <div className="absolute -top-3 left-3 z-20">
                        <Badge className={cn(
                          "px-3 py-1 rounded-full",
                          trophy.rarity === 'legendary' && "bg-amber-500 text-white",
                          trophy.rarity === 'epic' && "bg-purple-500 text-white",
                          trophy.rarity === 'rare' && "bg-blue-500 text-white",
                          trophy.rarity === 'uncommon' && "bg-green-500 text-white",
                          trophy.rarity === 'common' && "bg-gray-500 text-white"
                        )}>
                          {trophy.category === 'Games' && <Gamepad2 className="h-3 w-3 mr-1" />}
                          {trophy.category === 'Toys' && <Gift className="h-3 w-3 mr-1" />}
                          {trophy.category === 'Books' && <Book className="h-3 w-3 mr-1" />}
                          {trophy.category === 'Electronics' && <Smartphone className="h-3 w-3 mr-1" />}
                          {trophy.category === 'Clothing' && <Shirt className="h-3 w-3 mr-1" />}
                          {trophy.category === 'Treats' && <Utensils className="h-3 w-3 mr-1" />}
                          {trophy.category === 'Misc' && <Award className="h-3 w-3 mr-1" />}
                          {trophy.category}
                        </Badge>
                      </div>
                      
                      <div className="h-48 overflow-hidden relative">
                        {/* Rarity effect overlay */}
                        {trophy.rarity === 'legendary' && (
                          <div className="absolute inset-0 bg-gradient-to-b from-amber-100/30 to-transparent z-10 pointer-events-none" />
                        )}
                        {trophy.rarity === 'epic' && (
                          <div className="absolute inset-0 bg-gradient-to-b from-purple-100/20 to-transparent z-10 pointer-events-none" />
                        )}
                        
                        <img 
                          src={trophy.imageUrl} 
                          alt={trophy.title}
                          className="w-full h-full object-contain object-center"
                          onError={(e) => {
                            // Handle image load errors
                            (e.target as HTMLImageElement).src = '/placeholder-product.png';
                          }}
                        />
                        
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <Badge className={cn(
                            "flex items-center",
                            trophy.rarity === 'legendary' && "bg-amber-500 hover:bg-amber-600",
                            trophy.rarity === 'epic' && "bg-purple-500 hover:bg-purple-600",
                            trophy.rarity === 'rare' && "bg-blue-500 hover:bg-blue-600",
                            trophy.rarity === 'uncommon' && "bg-green-500 hover:bg-green-600",
                            trophy.rarity === 'common' && "bg-gray-500 hover:bg-gray-600"
                          )}>
                            {trophy.rarity === 'legendary' && <Crown className="h-3 w-3 mr-1" />}
                            {trophy.rarity === 'epic' && <Gem className="h-3 w-3 mr-1" />}
                            {trophy.rarity === 'rare' && <Sparkles className="h-3 w-3 mr-1" />}
                            {trophy.rarity === 'uncommon' && <Star className="h-3 w-3 mr-1" />}
                            {(trophy.rarity === 'common' || !trophy.rarity) && <TicketIcon className="h-3 w-3 mr-1" />}
                            {trophy.ticketCost} tickets
                          </Badge>
                        </div>
                        
                        {trophy.happiness && trophy.happiness > 0 && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-pink-500 hover:bg-pink-600">
                              <HeartHandshake className="h-3 w-3 mr-1" />
                              {trophy.happiness}/5
                            </Badge>
                          </div>
                        )}
                        
                        <div className="absolute top-6 right-2 flex flex-col space-y-1">
                          <Badge 
                            className="bg-blue-500 hover:bg-blue-600 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click
                              setSelectedTrophy(trophy);
                              setIsDetailViewOpen(true);
                            }}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Badge>
                          <Badge 
                            className="bg-red-500 hover:bg-red-600 cursor-pointer"
                            onClick={(e) => handleDeleteTrophy(trophy, e)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className={cn(
                          "font-bold truncate",
                          trophy.rarity === 'legendary' && "text-amber-600 dark:text-amber-400",
                          trophy.rarity === 'epic' && "text-purple-600 dark:text-purple-400",
                          trophy.rarity === 'rare' && "text-blue-600 dark:text-blue-400",
                          trophy.rarity === 'uncommon' && "text-green-600 dark:text-green-400"
                        )}>
                          {trophy.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(trophy.purchaseDate), "MMMM d, yyyy")}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
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
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="relative"
                      onClick={() => handleViewTrophy(trophy)}
                    >
                      <div className="absolute -left-10 mt-1.5">
                        <div className="h-4 w-4 rounded-full bg-amber-500 border-4 border-white dark:border-gray-900"></div>
                      </div>
                      <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 border-amber-200 dark:border-amber-800">
                        <div className="flex flex-col md:flex-row">
                          <div className="md:w-1/4 h-32 md:h-auto overflow-hidden">
                            <img 
                              src={trophy.imageUrl} 
                              alt={trophy.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-product.png';
                              }}
                            />
                          </div>
                          <div className="p-4 md:w-3/4">
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-amber-600 dark:text-amber-400 mb-1">
                                {format(new Date(trophy.purchaseDate), "MMMM d, yyyy")}
                              </p>
                              <Badge 
                                className="bg-blue-500 hover:bg-blue-600 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click
                                  setSelectedTrophy(trophy);
                                  setIsDetailViewOpen(true);
                                }}
                              >
                                <Pencil className="h-3 w-3 mr-1" />
                                Edit Trophy
                              </Badge>
                            </div>
                            <h3 className="font-bold mb-2">{trophy.title}</h3>
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-amber-500 hover:bg-amber-600">
                                <TicketIcon className="h-3 w-3 mr-1" />
                                {trophy.ticketCost} tickets
                              </Badge>
                              {trophy.happiness && trophy.happiness > 0 && (
                                <Badge className="bg-pink-500 hover:bg-pink-600">
                                  <HeartHandshake className="h-3 w-3 mr-1" />
                                  {trophy.happiness}/5
                                </Badge>
                              )}
                            </div>
                            {trophy.note && (
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 italic">
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
      </div>

      {/* Trophy Detail Modal */}
      {isDetailViewOpen && selectedTrophy && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10"
                onClick={handleCloseDetail}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
                <span className="sr-only">Close</span>
              </Button>
              
              <div className="h-56 overflow-hidden">
                <img 
                  src={selectedTrophy.imageUrl} 
                  alt={selectedTrophy.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-product.png';
                  }}
                />
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4">
                  <Badge className="bg-amber-500 hover:bg-amber-600">
                    <TicketIcon className="h-3 w-3 mr-1" />
                    {selectedTrophy.ticketCost} tickets
                  </Badge>
                </div>
              </div>
              
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2">{selectedTrophy.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Purchased on {format(new Date(selectedTrophy.purchaseDate), "MMMM d, yyyy")}
                </p>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">How happy are you with this reward?</h3>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        className={cn(
                          "p-2 rounded-full transition-colors",
                          happinessRatings[selectedTrophy.id] >= rating
                            ? "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30"
                            : "text-gray-400 hover:text-yellow-500 bg-gray-100 dark:bg-gray-800"
                        )}
                        onClick={() => handleSetHappiness(selectedTrophy.id, rating)}
                      >
                        <Star className="h-6 w-6" fill={happinessRatings[selectedTrophy.id] >= rating ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Add a note about this reward</h3>
                  <textarea
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    rows={3}
                    placeholder="What do you like about this reward?"
                    value={notes[selectedTrophy.id] || ''}
                    onChange={(e) => {
                      const newNotes = { ...notes };
                      newNotes[selectedTrophy.id] = e.target.value;
                      setNotes(newNotes);
                    }}
                  ></textarea>
                  <Button 
                    className="mt-2"
                    onClick={() => handleSaveNote(selectedTrophy.id, notes[selectedTrophy.id] || '')}
                  >
                    Save Note
                  </Button>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                    Trophy #{selectedTrophy.id}
                  </Badge>
                  <Button variant="outline" onClick={handleCloseDetail}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Trophy Detail Modal */}
      {selectedTrophy && (
        <TrophyDetailModal
          isOpen={isDetailViewOpen}
          onClose={() => {
            setIsDetailViewOpen(false);
            setSelectedTrophy(null);
          }}
          trophy={selectedTrophy}
          userId={targetUserId}
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
                  <p className="text-sm text-gray-500">{format(new Date(trophyToDelete.purchaseDate), "MMMM d, yyyy")}</p>
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