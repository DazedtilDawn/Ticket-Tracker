import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

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
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  user_id: z.string().min(1, "Please select a child"),
  tickets: z.string().transform((val) => parseInt(val, 10)).optional(),
  reason: z.string().min(1, "Please provide a reason"),
});

type FormValues = z.infer<typeof formSchema>;
type FormDataType = { 
  user_id: number; 
  tickets: number; 
  reason: string;
  assign_bonus_spin?: boolean;
};

interface GoodBehaviorDialogProps {
  children: React.ReactNode;
  onCompleted?: () => void;
}

// Simple NumberInput component that can be disabled and styled
interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

function NumberInput({ value, onChange, disabled = false, className }: NumberInputProps) {
  return (
    <Input 
      type="number" 
      min="1" 
      value={value.toString()} 
      onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      disabled={disabled}
      className={className}
    />
  );
}

export function GoodBehaviorDialog({ children, onCompleted }: GoodBehaviorDialogProps) {
  const [open, setOpen] = useState(false);
  const [tickets, setTickets] = useState(1);
  const [giveSpin, setGiveSpin] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getChildUsers } = useAuthStore();
  const childUsers = getChildUsers();

  // Add event listener for handling spin prompt events
  useEffect(() => {
    // Setup event listener for Dashboard to handle the spin prompt modal
    const handleEventResponse = (event: any) => {
      console.log('openSpinPromptModal event captured by dashboard');
    };

    window.addEventListener('openSpinPromptModalResponse', handleEventResponse);
    
    return () => {
      window.removeEventListener('openSpinPromptModalResponse', handleEventResponse);
    };
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_id: "",
      tickets: "1",
      reason: "",
    },
  });

  const goodBehaviorMutation = useMutation({
    mutationFn: async (data: FormDataType) => {
      return await apiRequest("/api/good-behavior", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (res) => {
      // Check if the server created a bonus spin, and if so, trigger the prompt
      if (res.bonus_triggered && res.daily_bonus_id) {
        // Find the child name based on the user_id
        const selectedChildId = parseInt(form.getValues().user_id);
        const child = childUsers.find(c => c.id === selectedChildId) || { name: "Child" };
        
        // Call the openSpinPromptModal function
        openSpinPromptModal({
          bonusId: res.daily_bonus_id,
          childName: child.name,
          friendlyTrigger: "Good Behavior",
        });
      }
      
      toast({
        title: giveSpin ? "Bonus Spin Added" : "Tickets Added",
        description: giveSpin 
          ? "Bonus wheel spin has been awarded for good behavior" 
          : "Bonus tickets have been added for good behavior",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      // Close dialog and reset form
      setOpen(false);
      form.reset();
      setGiveSpin(false);
      setTickets(1);
      
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

  // Function to open the spin prompt modal
  interface SpinPromptParams {
    bonusId: number;
    childName: string;
    friendlyTrigger: string;
  }
  
  const openSpinPromptModal = ({ bonusId, childName, friendlyTrigger }: SpinPromptParams) => {
    // We need to dispatch this event to the parent page that has the actual modal
    // This reaches up to the parent component that has the actual SpinPromptModal
    const event = new CustomEvent('openSpinPromptModal', { 
      detail: { 
        dailyBonusId: bonusId,
        childName,
        choreName: friendlyTrigger
      }
    });
    window.dispatchEvent(event);
  };

  const onSubmit = (data: FormValues) => {
    const ticketValue = giveSpin ? 0 : tickets;
    
    goodBehaviorMutation.mutate({
      user_id: parseInt(data.user_id),
      tickets: ticketValue,
      reason: data.reason,
      assign_bonus_spin: giveSpin,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Bonus Tickets</DialogTitle>
          <DialogDescription>
            Reward good behavior with bonus tickets. This will update the child's balance.
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
                    Select the child to reward with tickets
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why tickets are being added"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a reason for the bonus tickets
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Toggle for bonus spin */}
            <div className="flex items-center gap-2 mt-4 p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <Switch
                id="giveSpin"
                checked={giveSpin}
                onCheckedChange={setGiveSpin}
              />
              <label htmlFor="giveSpin" className="text-sm select-none">
                Award a <strong>Bonus Wheel Spin</strong> instead of tickets
              </label>
            </div>
            
            {/* Show helper text if spin option is selected */}
            {giveSpin && (
              <div className="text-xs text-green-600 dark:text-green-400 italic ml-1">
                Child will get to spin the wheel right away!
              </div>
            )}
            
            <FormField
              control={form.control}
              name="tickets"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tickets to Add</FormLabel>
                  <FormControl>
                    <NumberInput
                      value={tickets}
                      onChange={setTickets}
                      disabled={giveSpin}
                      className={cn(giveSpin && "opacity-40")}
                    />
                  </FormControl>
                  <FormDescription>
                    How many bonus tickets to add to balance
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
                disabled={goodBehaviorMutation.isPending || (!giveSpin && tickets < 1)}
              >
                {goodBehaviorMutation.isPending ? "Adding..." : giveSpin ? "Award Wheel Spin" : "Add Bonus Tickets"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}