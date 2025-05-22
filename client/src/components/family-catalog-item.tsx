import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Trophy, Gift, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import AwardTrophyDialog from "./award-trophy-dialog";

interface Product {
  id: number;
  title: string;
  price_cents: number;
  image_url: string | null;
  amazon_url: string | null;
}

interface User {
  id: number;
  name: string;
  role: string;
}

interface FamilyCatalogItemProps {
  product: Product;
}

export default function FamilyCatalogItem({ product }: FamilyCatalogItemProps) {
  const { user } = useAuthStore();
  const [selectedChild, setSelectedChild] = useState<User | null>(null);
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false);
  
  const isParent = user?.role === "parent";
  
  // Fetch children for award dropdown (only if parent)
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isParent,
  });
  
  const children = users.filter(u => u.role === "child");
  
  const priceInDollars = product.price_cents / 100;
  
  const handleAwardToChild = (child: User) => {
    setSelectedChild(child);
    setIsAwardDialogOpen(true);
  };
  
  const handleCloseAwardDialog = () => {
    setIsAwardDialogOpen(false);
    setSelectedChild(null);
  };
  
  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            {product.image_url ? (
              <img 
                src={product.image_url}
                alt={product.title}
                className="w-20 h-20 object-cover rounded-lg bg-gray-100"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                <Gift className="h-10 w-10 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold line-clamp-2 mb-2">
                {product.title}
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                ${priceInDollars.toFixed(2)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {isParent && children.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
                >
                  <Trophy className="h-4 w-4 mr-2 text-yellow-600" />
                  Award as Trophy
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {children.map((child) => (
                  <DropdownMenuItem 
                    key={child.id}
                    onClick={() => handleAwardToChild(child)}
                    className="cursor-pointer"
                  >
                    <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                    Award to {child.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="text-center text-gray-500 text-sm py-2">
              {isParent ? "No children found" : "Available in catalog"}
            </div>
          )}
          
          {product.amazon_url && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-2 text-xs"
              asChild
            >
              <a 
                href={product.amazon_url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                View on Amazon
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
      
      {/* Award Trophy Dialog */}
      {selectedChild && (
        <AwardTrophyDialog
          isOpen={isAwardDialogOpen}
          onClose={handleCloseAwardDialog}
          childId={selectedChild.id}
          childName={selectedChild.name}
          itemId={product.id}
          itemTitle={product.title}
          itemImage={product.image_url || undefined}
        />
      )}
    </>
  );
}