import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";
import { DailyBonusWheel } from "@/components/daily-bonus-wheel";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";

// Schema for form validation
const formSchema = z
  .object({
    user_id: z.string().min(1, "Please select a child"),
    rewardType: z.enum(["tickets", "spin"]),
    tickets: z.string().optional(),
    reason: z.string().optional(),
  })
  .refine(
    (data) => {
      // Only require tickets if rewardType is 'tickets'
      if (data.rewardType === "tickets") {
        const ticketValue = data.tickets ? parseInt(data.tickets, 10) : 0;
        return !isNaN(ticketValue) && ticketValue > 0;
      }
      return true;
    },
    {
      message: "Must add at least 1 ticket when awarding tickets directly",
      path: ["tickets"],
    },
  );

type FormValues = z.infer<typeof formSchema>;
type FormDataType = {
  user_id: number;
  tickets?: number;
  reason?: string;
  rewardType: "tickets" | "spin";
};

interface GoodBehaviorDialogProps {
  children?: React.ReactNode;
  onCompleted?: () => void;
  initialChildId?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export function GoodBehaviorDialog({
  children,
  onCompleted,
  initialChildId,
  isOpen: externalOpen,
  onClose,
}: GoodBehaviorDialogProps) {
  const [open, setOpen] = useState(false);
  
  // Use external open state if provided, otherwise use internal state
  const dialogOpen = externalOpen !== undefined ? externalOpen : open;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getChildUsers } = useAuthStore();
  const childUsers = getChildUsers();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_id: initialChildId ? initialChildId.toString() : "",
      rewardType: "tickets",
      tickets: "1",
      reason: "",
    },
  });

  // Update form value when initialChildId changes or dialog opens
  useEffect(() => {
    if (initialChildId && open) {
      form.setValue("user_id", initialChildId.toString());
    }
  }, [initialChildId, form, open]);

  // Watch for reward type changes to conditionally show form fields
  const rewardType = form.watch("rewardType");

  // Update the title message based on the reward type
  const [dialogTitle, setDialogTitle] = useState("Award Bonus Tickets");
  const [dialogDescription, setDialogDescription] = useState(
    "Reward good behavior with bonus tickets. This will update the child's balance.",
  );
  const [showWheelPreview, setShowWheelPreview] = useState(false);
  const [spinResult, setSpinResult] = useState<number | null>(null);

  useEffect(() => {
    if (rewardType === "tickets") {
      setDialogTitle("Award Bonus Tickets");
      setDialogDescription(
        "Reward good behavior with bonus tickets. This will update the child's balance.",
      );
    } else {
      setDialogTitle("Award Bonus Spin");
      setDialogDescription(
        "Reward good behavior with a bonus spin opportunity. The child will be able to spin the wheel on their next visit.",
      );
    }
  }, [rewardType]);

  const goodBehaviorMutation = useMutation({
    mutationFn: async (data: FormDataType) => {
      console.log("[MUTATION] Sending request with data:", data);
      return await apiRequest("/api/good-behavior", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (response) => {
      console.log("[MUTATION] Success response:", response);
      const selectedRewardType = form.getValues("rewardType");
      
      if (selectedRewardType === "spin") {
        // Show wheel preview for spin rewards
        setShowWheelPreview(true);
        setSpinResult(response.tickets || Math.floor(Math.random() * 5) + 1);
        
        // Hide wheel and close dialog after animation
        setTimeout(() => {
          setShowWheelPreview(false);
          setSpinResult(null);
          handleOpenChange(false);
          if (onCompleted) onCompleted();
        }, 3000);
      } else {
        // For ticket rewards, close immediately
        handleOpenChange(false);
        if (onCompleted) onCompleted();
      }

      const actionText = selectedRewardType === "tickets" ? "added" : "awarded";
      const descriptionText =
        selectedRewardType === "tickets"
          ? "Bonus tickets have been added for good behavior"
          : "A bonus wheel spin has been awarded for good behavior";

      toast({
        title: `Good behavior reward ${actionText}`,
        description: descriptionText,
      });

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-bonus/unspun"] });

      // Reset form
      form.reset({
        user_id: "",
        rewardType: "tickets",
        tickets: "1",
        reason: "",
      });

      if (onCompleted) {
        onCompleted();
      }
    },
    onError: (error: any) => {
      console.error("[MUTATION] Error:", error);
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to process the good behavior reward. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFormSubmit = (data: FormValues) => {
    console.log("[FORM] Submitting form with data:", data);

    const payload: FormDataType = {
      user_id: parseInt(data.user_id),
      reason: data.reason || "",
      rewardType: data.rewardType,
    };

    // Only include tickets if it's a direct ticket reward
    if (data.rewardType === "tickets" && data.tickets) {
      payload.tickets = parseInt(data.tickets, 10);
    }

    console.log("[FORM] Final payload for API:", payload);

    // Submit the request
    goodBehaviorMutation.mutate(payload);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (externalOpen !== undefined) {
      // If using external state, call onClose when closing
      if (!newOpen && onClose) {
        onClose();
      }
    } else {
      // If using internal state, update it normally
      setOpen(newOpen);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-5"
          >
            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Child</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a child" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {childUsers.map((child) => (
                        <SelectItem key={child.id} value={child.id.toString()}>
                          {child.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Select the child to reward</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rewardType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Reward Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="tickets" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Award Tickets Directly
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="spin" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Award Bonus Wheel Spin
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    Choose how to reward the child
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {rewardType === "tickets" && (
              <FormField
                control={form.control}
                name="tickets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tickets to Add</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      How many bonus tickets to add to balance
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why this reward is being given"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a reason for the good behavior reward
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Show wheel preview when awarding spin */}
            {showWheelPreview && (
              <div className="mt-6 text-center">
                <div className="mx-auto w-32 h-32 relative">
                  <div 
                    className="w-full h-full border-4 border-gray-300 rounded-full flex items-center justify-center text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-white animate-spin"
                    style={{
                      animation: "spin 2s ease-out",
                      animationFillMode: "forwards"
                    }}
                  >
                    🎉
                  </div>
                  {spinResult && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold text-purple-600 shadow-lg">
                        +{spinResult}
                      </div>
                    </div>
                  )}
                </div>
                <p className="mt-4 text-lg font-semibold text-green-600">
                  🎯 Bonus Spin Awarded! +{spinResult} tickets!
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="submit"
                variant="default"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                disabled={goodBehaviorMutation.isPending || showWheelPreview}
              >
                {goodBehaviorMutation.isPending
                  ? "Processing..."
                  : rewardType === "tickets"
                    ? "Award Tickets"
                    : "Award Bonus Spin"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
