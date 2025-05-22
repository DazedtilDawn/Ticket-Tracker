import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Package } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import FamilyCatalogItem from "@/components/family-catalog-item";

interface Product {
  id: number;
  title: string;
  price_cents: number;
  image_url: string | null;
  amazon_url: string | null;
}

export default function FamilyCatalog() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch all products
  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        <span className="ml-2">Loading catalog...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Error loading family catalog</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-500" />
            Family Catalog
          </h1>
          <p className="text-gray-600 mt-1">
            Browse items that can be earned as goals or awarded as trophies
          </p>
        </div>
        
        <Badge variant="secondary" className="px-3 py-1">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'Item' : 'Items'}
        </Badge>
      </div>
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search catalog items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Parent Instructions */}
      {user?.role === "parent" && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 text-white rounded-full p-2">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Parent Quick Actions</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Use the "Award as Trophy" button on any item to instantly award it to one of your children. 
                  This creates a trophy entry in their Trophy Room without spending tickets.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 mb-2">
            {searchTerm ? 'No items found' : 'No items in catalog'}
          </h3>
          <p className="text-gray-400">
            {searchTerm 
              ? `Try searching for something else` 
              : 'Items will appear here when added to the family catalog'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <FamilyCatalogItem 
              key={product.id} 
              product={product} 
            />
          ))}
        </div>
      )}
    </div>
  );
}