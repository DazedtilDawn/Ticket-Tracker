import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuthStore } from '@/store/auth-store';
import { ShoppingCart, User, Ticket } from 'lucide-react';

interface PurchaseDialogProps {
  productId: number;
  productTitle: string;
  ticketCost: number;
  children: React.ReactNode;
}

export function PurchaseDialog({ productId, productTitle, ticketCost, children }: PurchaseDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const { user, getChildUsers } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const childUsers = getChildUsers() || [];

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/spend', {
        method: 'POST',
        body: JSON.stringify({
          tickets: ticketCost,
          user_id: selectedUserId ? parseInt(selectedUserId) : undefined,
          reason: `Purchase: ${productTitle}`
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Purchase Successful!",
        description: `${productTitle} purchased for ${ticketCost} tickets.`,
      });
      
      // Refresh balances and transactions
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      setIsOpen(false);
      setSelectedUserId('');
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: error.message || "Failed to complete purchase",
      });
    }
  });

  const handlePurchase = () => {
    if (!selectedUserId && childUsers.length > 0) {
      toast({
        variant: "destructive",
        title: "Selection Required",
        description: "Please select which child to purchase for",
      });
      return;
    }
    purchaseMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Purchase Item
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium">{productTitle}</h3>
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <Ticket className="h-4 w-4" />
                {ticketCost} tickets
              </div>
            </div>
          </div>

          {childUsers.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Purchase for:
              </label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a child" />
                </SelectTrigger>
                <SelectContent>
                  {childUsers.map((child: any) => (
                    <SelectItem key={child.id} value={child.id.toString()}>
                      {child.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePurchase}
              disabled={purchaseMutation.isPending}
              className="flex-1"
            >
              {purchaseMutation.isPending ? 'Processing...' : 'Confirm Purchase'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}