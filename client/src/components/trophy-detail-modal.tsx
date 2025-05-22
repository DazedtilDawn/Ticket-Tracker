import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trophy, ImageIcon, Save, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TrophyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  trophy: any; // Will be properly typed later
  userId: number | undefined;
}

export function TrophyDetailModal({ isOpen, onClose, trophy, userId }: TrophyDetailModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Initialize form with trophy data
  useEffect(() => {
    if (trophy) {
      setName(trophy.note || trophy.product?.title || "My Trophy");
      setDescription(trophy.description || "");
      setImagePreview(trophy.custom_image_url || trophy.product?.image_url || "");
    }
  }, [trophy]);
  
  // Fetch catalog items for dropdown
  useEffect(() => {
    const fetchCatalogItems = async () => {
      try {
        const items = await apiRequest('/api/products');
        if (Array.isArray(items)) {
          setCatalogItems(items);
        }
      } catch (error) {
        console.error("Failed to fetch catalog items:", error);
      }
    };
    
    fetchCatalogItems();
  }, []);
  
  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle catalog item selection
  const handleCatalogItemChange = (value: string) => {
    setSelectedCatalogItem(value);
    const item = catalogItems.find(item => item.id.toString() === value);
    if (item) {
      setImagePreview(item.image_url);
    }
  };
  
  // Save trophy customizations
  const handleSave = async () => {
    if (!userId || !trophy?.id) {
      toast({
        title: "Error",
        description: "Missing user ID or trophy ID",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('transaction_id', trophy.id.toString());
      formData.append('user_id', userId.toString());
      
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (selectedCatalogItem) {
        formData.append('catalog_item_id', selectedCatalogItem);
      }
      
      // Update trophy
      const result = await apiRequest('/api/trophies/update', {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type here - it will be set automatically for FormData
        }
      });
      
      if (result?.success) {
        toast({
          title: "Trophy updated",
          description: "Your trophy has been customized successfully.",
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({queryKey: ['/api/transactions/purchases']});
        queryClient.invalidateQueries({queryKey: ['/api/trophies']});
        
        onClose();
      } else {
        throw new Error(result?.message || "Failed to update trophy");
      }
    } catch (error) {
      console.error("Error updating trophy:", error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your trophy. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Trophy Details
          </DialogTitle>
          <DialogDescription>
            Customize your trophy to make it special!
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Trophy name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="trophy-name" className="text-right">
              Name
            </Label>
            <Input
              id="trophy-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="My Special Trophy"
            />
          </div>
          
          {/* Trophy description */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="trophy-description" className="text-right">
              Description
            </Label>
            <Textarea
              id="trophy-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Describe your achievement..."
            />
          </div>
          
          {/* Trophy image */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Trophy Image</Label>
            <div className="col-span-3 space-y-2">
              {/* Image preview */}
              <div className="flex justify-center">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Trophy preview" 
                    className="h-40 w-40 object-contain border rounded-md"
                  />
                ) : (
                  <div className="h-40 w-40 border rounded-md flex items-center justify-center bg-muted">
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Image upload */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="trophy-image" className="cursor-pointer">
                  <div className="flex items-center gap-2 rounded-md border p-2 justify-center hover:bg-muted">
                    <ImageIcon className="h-4 w-4" />
                    <span>Upload custom image</span>
                  </div>
                  <Input
                    id="trophy-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </Label>
                
                {/* Catalog item selection */}
                <div className="space-y-1">
                  <Label htmlFor="catalog-item">Or choose from catalog</Label>
                  <Select value={selectedCatalogItem} onValueChange={handleCatalogItemChange}>
                    <SelectTrigger id="catalog-item">
                      <SelectValue placeholder="Select a catalog item" />
                    </SelectTrigger>
                    <SelectContent>
                      {catalogItems.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-1">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </span>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Trophy
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}