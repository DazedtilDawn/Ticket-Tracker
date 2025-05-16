import { useState } from "react";
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

const formSchema = z.object({
  user_id: z.string().min(1, "Please select a child"),
  tickets: z.string().transform((val) => parseInt(val, 10)).refine((val) => val > 0, {
    message: "Must add at least 1 ticket",
  }),
  reason: z.string().min(1, "Please provide a reason"),
});

type FormValues = z.infer<typeof formSchema>;
type FormDataType = { user_id: number; tickets: number; reason: string };

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
    onSuccess: () => {
      toast({
        title: "Tickets added",
        description: "Bonus tickets have been added for good behavior",
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
        description: "Failed to add tickets. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    goodBehaviorMutation.mutate({
      user_id: parseInt(data.user_id),
      tickets: parseInt(data.tickets),
      reason: data.reason,
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
            <DialogFooter>
              <Button
                type="submit"
                variant="default"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                disabled={goodBehaviorMutation.isPending}
              >
                {goodBehaviorMutation.isPending ? "Adding..." : "Add Bonus Tickets"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}