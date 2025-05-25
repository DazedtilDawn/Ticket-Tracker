import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Trophy, Gift } from "lucide-react";

interface AwardTrophyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  childId: number;
  childName: string;
  itemId: number;
  itemTitle: string;
  itemImage?: string;
}

export default function AwardTrophyDialog({
  isOpen,
  onClose,
  childId,
  childName,
  itemId,
  itemTitle,
  itemImage,
}: AwardTrophyDialogProps) {
  const [customNote, setCustomNote] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const awardMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/child/${childId}/award-item`, {
        method: "POST",
        body: JSON.stringify({
          item_id: itemId,
          custom_note: customNote.trim() || undefined,
        }),
      });
    },
    onSuccess: (response) => {
      // Invalidate the child's trophy list to show the new award
      queryClient.invalidateQueries({ queryKey: ["trophies", childId] });

      // Show success toast
      toast({
        title: "🏆 Trophy Awarded!",
        description: `Successfully awarded "${itemTitle}" to ${childName}!`,
        variant: "default",
      });

      // Close dialog and reset form
      onClose();
      setCustomNote("");
    },
    onError: (error: any) => {
      console.error("Award failed:", error);
      toast({
        title: "Award Failed",
        description:
          error.message || "Failed to award trophy. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAward = () => {
    awardMutation.mutate();
  };

  const handleClose = () => {
    if (!awardMutation.isPending) {
      onClose();
      setCustomNote("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Award Trophy to {childName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            {itemImage ? (
              <img
                src={itemImage}
                alt={itemTitle}
                className="w-12 h-12 object-cover rounded"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                <Gift className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="font-medium text-sm">{itemTitle}</h3>
              <p className="text-xs text-gray-500">Trophy Item</p>
            </div>
          </div>

          {/* Custom Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Custom Message (Optional)</Label>
            <Textarea
              id="note"
              placeholder={`Add a special message for ${childName}...`}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              maxLength={200}
              rows={3}
            />
            <p className="text-xs text-gray-500">
              {customNote.length}/200 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={awardMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAward}
              disabled={awardMutation.isPending}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600"
            >
              {awardMutation.isPending ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Awarding...
                </>
              ) : (
                <>
                  <Trophy className="h-4 w-4 mr-2" />
                  Award Trophy
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
