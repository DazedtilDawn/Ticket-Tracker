import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";

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
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
  user_id: z.string().min(1, "Please select a child"),
  rewardType: z.enum(["tickets", "spin"]),
  tickets: z.string().transform((val) => parseInt(val, 10)).refine(
    (val) => val > 0, 
    { message: "Must add at least 1 ticket" }
  ).optional(),
  reason: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type FormDataType = { 
  user_id: number; 
  tickets?: number; 
  reason?: string; 
  rewardType: "tickets" | "spin";
};

interface GoodBehaviorDialogProps {
  children: React.ReactNode;
  onCompleted?: () => void;
}

export function GoodBehaviorDialog({ children, onCompleted }: GoodBehaviorDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getChildUsers } = useAuthStore();
  const childUsers = getChildUsers();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_id: "",
      rewardType: "tickets",
      tickets: 1,
      reason: "",
    },
  });

  // Watch for reward type changes to conditionally show form fields
  const rewardType = form.watch("rewardType");

  // Update the title message based on the reward type
  const [dialogTitle, setDialogTitle] = useState("Add Bonus Tickets");
  const [dialogDescription, setDialogDescription] = useState(
    "Reward good behavior with bonus tickets. This will update the child's balance."
  );
  
  useEffect(() => {
    if (rewardType === "tickets") {
      setDialogTitle("Award Bonus Tickets");
      setDialogDescription("Reward good behavior with bonus tickets. This will update the child's balance.");
    } else {
      setDialogTitle("Award Bonus Spin");
      setDialogDescription("Reward good behavior with a bonus spin opportunity. The child will be able to spin the wheel on their next visit.");
    }
  }, [rewardType]);

  const goodBehaviorMutation = useMutation({
    mutationFn: async (data: FormDataType) => {
      return await apiRequest("/api/good-behavior", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (response) => {
      const rewardType = form.getValues("rewardType");
      const actionText = rewardType === "tickets" ? "added" : "awarded";
      const descriptionText = rewardType === "tickets" 
        ? "Bonus tickets have been added for good behavior" 
        : "A bonus wheel spin has been awarded for good behavior";
      
      toast({
        title: `Good behavior reward ${actionText}`,
        description: descriptionText,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      // Close dialog and reset form
      setOpen(false);
      form.reset();
      
      if (onCompleted) {
        onCompleted();
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process the good behavior reward. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    const payload: FormDataType = {
      user_id: parseInt(data.user_id),
      reason: data.reason || "",
      rewardType: data.rewardType
    };
    
    // Only include tickets if it's a direct ticket reward
    if (data.rewardType === "tickets" && data.tickets) {
      payload.tickets = data.tickets;
    }
    // For bonus spin, we don't send the tickets parameter at all
    
    goodBehaviorMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Child</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
                  <FormDescription>
                    Select the child to reward
                  </FormDescription>
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
                      defaultValue={field.value}
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
            
            <DialogFooter>
              <Button
                type="submit"
                variant="default"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                disabled={goodBehaviorMutation.isPending}
              >
                {goodBehaviorMutation.isPending ? "Processing..." : 
                  rewardType === "tickets" ? "Award Tickets" : "Award Bonus Spin"
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
