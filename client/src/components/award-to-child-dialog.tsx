import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AwardToChildDialogProps {
  product: any;
  children?: React.ReactNode;
}

export function AwardToChildDialog({ product, children }: AwardToChildDialogProps) {
  const { getChildUsers } = useAuthStore();
  const childUsers = getChildUsers() || [];
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [customNote, setCustomNote] = useState("");
  const [awardedDate, setAwardedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(Number(childId));
  };

  const resetForm = () => {
    setSelectedChildId(null);
    setCustomNote("");
    setAwardedDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedChildId) {
      toast({
        title: "Error",
        description: "Please select a child",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create a transaction that represents the award as a gift (positive transaction)
      // We'll create it as a "manual_add" transaction with special metadata
      await apiRequest("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedChildId,
          delta: 0, // No change to balance - this is just a trophy
          type: "spend", // Mark as spend so it shows up in Trophy Room
          source: "family_contrib",
          note: product.title,
          metadata: JSON.stringify({
            award_type: "parent_gift",
            product_id: product.id,
            custom_image_url: product.image_url,
            description: customNote || `Special award from parent: ${product.title}`,
            awarded_date: awardedDate,
            product_title: product.title,
            product_price_cents: product.price_cents
          })
        }),
      });

      toast({
        title: "Award Added!",
        description: `Successfully added to child's achievement gallery`,
        variant: "default",
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/purchases"] });
      
      setOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error awarding to child:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add award to child",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Award to Child's Trophy Room
            </DialogTitle>
            <DialogDescription>
              Add this item directly to a child's Achievement Gallery as a special award.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-6">
            {/* Product Preview */}
            <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-lg">
              <div className="h-16 w-16 relative rounded-md overflow-hidden border">
                <img 
                  src={product.image_url} 
                  alt={product.title}
                  className="object-contain w-full h-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder-product.png";
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{product.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {(product.price_cents / 25).toFixed(0)} tickets
                  </Badge>
                </div>
              </div>
            </div>
            
            <Separator />

            {/* Child Selection */}
            <div>
              <h3 className="text-sm font-medium mb-3">Select child to receive this award:</h3>
              {childUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No child accounts available.</p>
              ) : (
                <RadioGroup
                  value={selectedChildId?.toString() || ""}
                  onValueChange={handleSelectChild}
                  className="space-y-2"
                >
                  {childUsers.map((child) => (
                    <div key={child.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
                      <RadioGroupItem value={child.id.toString()} id={`child-${child.id}`} />
                      <Label
                        htmlFor={`child-${child.id}`}
                        className="flex items-center gap-2 cursor-pointer w-full"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={child.profile_image_url || ""} alt={child.name} />
                          <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{child.name}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>

            {/* Custom Note */}
            <div className="space-y-2">
              <Label htmlFor="custom-note" className="text-sm font-medium">
                Add a custom note (optional):
              </Label>
              <Textarea
                id="custom-note"
                placeholder="Great job on completing your homework this week!"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="resize-none"
              />
            </div>

            {/* Award Date */}
            <div className="space-y-2">
              <Label htmlFor="awarded-date" className="text-sm font-medium">
                Date Awarded:
              </Label>
              <Input
                id="awarded-date"
                type="date"
                value={awardedDate}
                onChange={(e) => setAwardedDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedChildId || childUsers.length === 0}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Awarding...
                </>
              ) : (
                "Add to Trophy Room"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}