import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/store/auth-store";
import { Loader2 } from "lucide-react";

interface AssignToChildDialogProps {
  productId: number;
  trigger?: React.ReactNode;
  onAssigned?: () => void;
  children?: React.ReactNode;
}

export function AssignToChildDialog({ productId, trigger, onAssigned, children }: AssignToChildDialogProps) {
  const { getChildUsers } = useAuthStore();
  const children = getChildUsers();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const toggle = (id: number, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((v) => v !== id)));
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) return;
    setIsSaving(true);
    try {
      await Promise.all(
        selectedIds.map((childId) =>
          apiRequest("/api/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: childId, product_id: productId })
          })
        )
      );
      toast({ title: "Added", description: "Product added to selected wishlists." });
      onAssigned && onAssigned();
      setOpen(false);
      setSelectedIds([]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || children}</DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add to Child's Wishlist</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {children.length === 0 ? (
            <p className="text-sm text-gray-500">No child accounts found.</p>
          ) : (
            children.map((child) => (
              <label key={child.id} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedIds.includes(child.id)}
                  onCheckedChange={(c) => toggle(child.id, !!c)}
                />
                <span>{child.name}</span>
              </label>
            ))
          )}
        </div>
        <DialogFooter className="mt-4">
          <Button onClick={handleSave} disabled={isSaving || selectedIds.length === 0}>
            {isSaving ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Add"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
