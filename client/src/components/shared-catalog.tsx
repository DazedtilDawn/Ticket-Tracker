import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { TICKET_CENT_VALUE } from '../../../config/business';

import { AddProductDialog } from './add-product-dialog';
import { EditProductDialog } from './edit-product-dialog';
import { DeleteProductDialog } from './delete-product-dialog';
import { AssignToChildDialog } from './assign-to-child-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useAuthStore, UserInfo } from '@/store/auth-store';
import { 
  Gift, 
  ArrowRight, 
  PencilIcon, 
  Trash2, 
  PlusCircle, 
  Search, 
  Grid, 
  List, 
  Star, 
  Heart, 
  Flame, 
  Ticket, 
  InfoIcon, 
  SlidersHorizontal,
  Tag
} from 'lucide-react';
import { CardActions } from '@/components/ui/card-actions';

interface SharedCatalogProps {
  onProductSelected: (productId: number) => void;
}

// Basic categories to organize products
const CATEGORIES = [
  { id: 'all', name: 'All Items', icon: <Gift className="h-4 w-4" />, color: 'bg-slate-100 text-slate-700' },
  { id: 'toys', name: 'Toys & Games', icon: <Star className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700' },
  { id: 'electronics', name: 'Electronics', icon: <Flame className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700' },
  { id: 'lego', name: 'LEGO Sets', icon: <Grid className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-700' },
  { id: 'books', name: 'Books', icon: <List className="h-4 w-4" />, color: 'bg-green-100 text-green-700' },
  { id: 'misc', name: 'Everything Else', icon: <Tag className="h-4 w-4" />, color: 'bg-red-100 text-red-700' },
];

// Get category based on product title or description
const getProductCategory = (product: any) => {
  const title = product.title.toLowerCase();
  
  if (title.includes('lego') || title.includes('building blocks')) {
    return 'lego';
  } else if (title.includes('book') || title.includes('novel') || title.includes('reading')) {
    return 'books';
  } else if (
    title.includes('electronic') || 
    title.includes('tablet') || 
    title.includes('phone') || 
    title.includes('computer') || 
    title.includes('digital')
  ) {
    return 'electronics';
  } else if (
    title.includes('toy') || 
    title.includes('game') || 
    title.includes('play') || 
    title.includes('figure')
  ) {
    return 'toys';
  }
  
  return 'misc';
};

export function SharedCatalog({ onProductSelected }: SharedCatalogProps) {
  const { user, isViewingAsChild, getChildUsers } = useAuthStore();
  const childUsers = getChildUsers() || [];
  const canManageCatalog = user?.role === 'parent' && !isViewingAsChild();
  
  // Get all available products
  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  // Get all goals to check which children have wishlist items
  const { data: goals = [] } = useQuery<any[]>({
    queryKey: ["/api/goals"],
  });
  
  // State for filters and views
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  const handleAddToWishlist = (productId: number) => {
    onProductSelected(productId);
  };

  const refreshCatalog = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
  };
  
  // Filter products based on search and category
  const filteredProducts = products.filter((product: any) => {
    // Apply search filter
    const matchesSearch = !searchQuery || 
      product.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply category filter
    const matchesCategory = selectedCategory === 'all' || 
      getProductCategory(product) === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get child users who have this product in their wishlist
  const getWishlistingChildren = (productId: number) => {
    if (!goals || !goals.length) return [];
    
    return goals
      .filter((goal: any) => goal.product_id === productId)
      .map((goal: any) => {
        const childUser = childUsers.find((child: any) => child.id === goal.user_id);
        return childUser ? { ...childUser, isActive: goal.is_active } : null;
      })
      .filter(Boolean);
  };
  
  // Calculate and format ticket price
  const calculateTickets = (priceInCents: number) => {
    return Math.ceil(priceInCents / TICKET_CENT_VALUE);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced catalog header with search and filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-950/50 dark:to-blue-950/30 p-4 rounded-lg">
        <div>
          <h2 className="text-lg font-bold text-primary-900 dark:text-primary-100 flex items-center">
            <Gift className="mr-2 h-5 w-5 text-primary-600 dark:text-primary-400" />
            Family Treasure Catalog
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Discover amazing items to add to your wishlist!
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search items..." 
              className="pl-9 bg-white dark:bg-slate-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant={showFilters ? "default" : "outline"} 
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="h-9 w-9"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            
            <Button 
              variant={viewMode === 'grid' ? "default" : "outline"} 
              size="icon"
              onClick={() => setViewMode('grid')}
              className="h-9 w-9"
            >
              <Grid className="h-4 w-4" />
            </Button>
            
            <Button 
              variant={viewMode === 'list' ? "default" : "outline"} 
              size="icon"
              onClick={() => setViewMode('list')}
              className="h-9 w-9"
            >
              <List className="h-4 w-4" />
            </Button>
            
            {canManageCatalog && (
              <AddProductDialog onProductAdded={refreshCatalog}>
                <Button size="sm" className="whitespace-nowrap">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </AddProductDialog>
            )}
          </div>
        </div>
      </div>
      
      {/* Category filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 pb-2">
          {CATEGORIES.map(category => (
            <Button
              key={category.id}
              variant="outline"
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={`${
                selectedCategory === category.id ? 
                'ring-2 ring-primary-500 ring-offset-1' : ''
              } ${category.color}`}
            >
              {category.icon}
              <span className="ml-2">{category.name}</span>
            </Button>
          ))}
        </div>
      )}
            
      {filteredProducts.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
          <Gift className="h-12 w-12 mx-auto mb-3 text-slate-400" />
          <h3 className="text-lg font-medium mb-2">
            {products.length === 0 ? "No products in the catalog yet" : "No items match your search"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {products.length === 0 
              ? "Products added to the catalog will be available for everyone in the family."
              : "Try changing your search terms or selecting a different category."
            }
          </p>
          {canManageCatalog && products.length === 0 && (
            <AddProductDialog onProductAdded={refreshCatalog}>
              <Button>
                <Gift className="mr-2 h-4 w-4" />
                Add Your First Product
              </Button>
            </AddProductDialog>
          )}
        </div>
      ) : (
        <ScrollArea className="h-[500px] rounded-md border">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              {filteredProducts.map((product: any) => {
                const wishlistChildren = getWishlistingChildren(product.id);
                const ticketPrice = calculateTickets(product.price_cents);
                const category = getProductCategory(product);
                const categoryInfo = CATEGORIES.find(c => c.id === category);
                
                return (
                  <Card
                    key={product.id}
                    className="overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] group relative"
                  >
                    {/* Category badge */}
                    {categoryInfo && (
                      <div className={`absolute top-2 left-2 z-10 ${categoryInfo.color} px-2 py-1 rounded-md text-xs font-medium flex items-center`}>
                        {categoryInfo.icon}
                        <span className="ml-1">{categoryInfo.name}</span>
                      </div>
                    )}
                    
                    {/* Wishlist indicators */}
                    {wishlistChildren.length > 0 && (
                      <div className="absolute top-2 right-2 z-10 flex -space-x-2">
                        <TooltipProvider>
                          {wishlistChildren.map((child: any, index: number) => (
                            <Tooltip key={child.id}>
                              <TooltipTrigger asChild>
                                <div className={`${child.isActive ? 'ring-2 ring-yellow-400' : ''} rounded-full`}>
                                  <Avatar className="h-8 w-8 border-2 border-white">
                                    {child.profile_image_url ? (
                                      <AvatarImage src={child.profile_image_url} alt={child.name} />
                                    ) : (
                                      <AvatarFallback className={`${
                                        child.isActive ? 'bg-yellow-100 text-yellow-800' : 'bg-primary-100 text-primary-800'
                                      }`}>
                                        {child.name.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm font-medium">{child.name}'s Wishlist</div>
                                {child.isActive && <div className="text-xs text-yellow-600">Active Goal!</div>}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </TooltipProvider>
                      </div>
                    )}
                    
                    {/* Product image with hover effect */}
                    <div className="relative overflow-hidden group-hover:opacity-95 transition-opacity h-40 bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="h-full w-auto mx-auto object-contain transition-transform group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <Gift className="h-12 w-12 text-slate-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Product content */}
                    <CardContent className="p-4">
                      <h3 className="font-medium line-clamp-2 mb-2 text-gray-800 dark:text-gray-100 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                        {product.title}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                          ${(product.price_cents / 100).toFixed(2)}
                        </Badge>
                        
                        <div className="flex items-center">
                          <Ticket className="h-4 w-4 text-amber-500 mr-1" />
                          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                            {ticketPrice}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    
                    {/* Card footer with actions */}
                    <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                      {canManageCatalog && (
                        <>
                          <div className="flex w-full justify-between items-center">
                            <span className="text-xs text-muted-foreground">Manage:</span>
                            <CardActions
                              items={[
                                { 
                                  label: 'Edit', 
                                  icon: <PencilIcon className="h-4 w-4" />, 
                                  onSelect: () => {} 
                                },
                                { 
                                  label: 'Delete', 
                                  icon: <Trash2 className="h-4 w-4" />, 
                                  className: 'text-destructive hover:!bg-destructive/10', 
                                  onSelect: () => {} 
                                },
                              ]}
                            />
                          </div>
                          {childUsers && childUsers.length > 0 && (
                            <AssignToChildDialog productId={product.id} onAssigned={refreshCatalog}>
                              <Button size="sm" variant="default" className="w-full bg-primary hover:bg-primary/90">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add to Child
                              </Button>
                            </AssignToChildDialog>
                          )}
                        </>
                      )}
                      
                      {/* Children (or parent viewing as child) see "Add to My Wishlist" */}
                      {!canManageCatalog && (
                        <Button 
                          className="w-full mt-2 group" 
                          size="sm" 
                          onClick={() => handleAddToWishlist(product.id)}
                        >
                          <Heart className="mr-2 h-4 w-4 group-hover:text-pink-500 group-hover:fill-pink-500 transition-colors" />
                          Add to My Wishlist
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="divide-y">
              {filteredProducts.map((product: any) => {
                const wishlistChildren = getWishlistingChildren(product.id);
                const ticketPrice = calculateTickets(product.price_cents);
                const category = getProductCategory(product);
                const categoryInfo = CATEGORIES.find(c => c.id === category);
                
                return (
                  <div key={product.id} className="flex p-4 hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                    {/* Product image */}
                    <div className="h-24 w-24 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center overflow-hidden mr-4">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="h-full w-auto object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <Gift className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                    
                    {/* Product details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-800 dark:text-gray-100">{product.title}</h3>
                          
                          {/* Price and ticket info */}
                          <div className="flex mt-1 mb-2 gap-2">
                            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                              ${(product.price_cents / 100).toFixed(2)}
                            </Badge>
                            
                            <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400 flex items-center">
                              <Ticket className="h-3 w-3 mr-1" />
                              {ticketPrice} tickets
                            </Badge>
                            
                            {categoryInfo && (
                              <Badge variant="outline" className={`${categoryInfo.color} border-0 flex items-center`}>
                                {categoryInfo.icon}
                                <span className="ml-1">{categoryInfo.name}</span>
                              </Badge>
                            )}
                          </div>
                          
                          {/* Children who want this */}
                          {wishlistChildren.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-xs text-slate-500">Wanted by:</span>
                              <div className="flex -space-x-2">
                                <TooltipProvider>
                                  {wishlistChildren.map((child: any) => (
                                    <Tooltip key={child.id}>
                                      <TooltipTrigger asChild>
                                        <div className={`${child.isActive ? 'ring-2 ring-yellow-400' : ''} rounded-full`}>
                                          <Avatar className="h-6 w-6 border-2 border-white">
                                            {child.profile_image_url ? (
                                              <AvatarImage src={child.profile_image_url} alt={child.name} />
                                            ) : (
                                              <AvatarFallback className={`text-[10px] ${
                                                child.isActive ? 'bg-yellow-100 text-yellow-800' : 'bg-primary-100 text-primary-800'
                                              }`}>
                                                {child.name.substring(0, 2).toUpperCase()}
                                              </AvatarFallback>
                                            )}
                                          </Avatar>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="text-sm font-medium">{child.name}'s Wishlist</div>
                                        {child.isActive && <div className="text-xs text-yellow-600">Active Goal!</div>}
                                      </TooltipContent>
                                    </Tooltip>
                                  ))}
                                </TooltipProvider>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex flex-col gap-2">
                          {canManageCatalog ? (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-500 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              {childUsers && childUsers.length > 0 && (
                                <AssignToChildDialog productId={product.id} onAssigned={refreshCatalog}>
                                  <Button size="sm" variant="default" className="h-8">
                                    <PlusCircle className="mr-1 h-3 w-3" />
                                    Assign
                                  </Button>
                                </AssignToChildDialog>
                              )}
                            </div>
                          ) : (
                            <Button size="sm" onClick={() => handleAddToWishlist(product.id)}>
                              <Heart className="mr-2 h-4 w-4" />
                              Add to Wishlist
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
}
