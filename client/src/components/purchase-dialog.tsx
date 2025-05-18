import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "@/hooks/use-toast";

export function PurchaseDialog({ children, onCompleted }: { children: React.ReactNode, onCompleted?: () => void }) {
  const [open, setOpen] = useState(false);
  const [tickets, setTickets] = useState<number>(0);
  const { getActiveChildId } = useAuthStore();

  const handleSubmit = async () => {
    try {
      await apiRequest("/api/spend", {
        method: "POST",
        body: JSON.stringify({
          user_id: getActiveChildId(),
          tickets,                         // positive integer
          reason: "Purchase: General purchase"
        })
      });
      toast({ title: "Purchase complete", description: `-${tickets} tickets spent` });
      setOpen(false);
      setTickets(0);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)}>{children}</span>

      <DialogContent>
        <DialogHeader>Spend tickets on a purchase</DialogHeader>

        <label className="space-y-1">
          <span className="text-sm font-medium">Tickets to spend</span>
          <Input type="number" min={1} value={tickets} onChange={e => setTickets(+e.target.value)} />
        </label>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={tickets <= 0} onClick={handleSubmit}>Confirm purchase</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}