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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus, Upload } from "lucide-react";

const addChildSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  profile_image_url: z.string().optional(),
});

type AddChildFormData = z.infer<typeof addChildSchema>;

interface AddChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddChildDialog({ open, onOpenChange }: AddChildDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const refreshFamilyUsers = useAuthStore((state) => state.refreshFamilyUsers);

  const form = useForm<AddChildFormData>({
    resolver: zodResolver(addChildSchema),
    defaultValues: {
      name: "",
      profile_image_url: undefined,
    },
  });

  const createChildMutation = useMutation({
    mutationFn: async (data: AddChildFormData) => {
      const response = await apiRequest("/api/family/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Child profile created successfully",
      });
      
      // Invalidate the children query to refresh the list
      await queryClient.invalidateQueries({ queryKey: ["/api/family/children"] });
      
      // Refresh family users in auth store
      if (refreshFamilyUsers) {
        await refreshFamilyUsers();
      }
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create child profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: AddChildFormData) => {
    setIsSubmitting(true);
    try {
      await createChildMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" />
            Add New Child
          </DialogTitle>
          <DialogDescription>
            Create a new child profile for your family. Each child can track
            their own tickets and progress.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter child's name"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Profile image upload will be added in a future iteration */}
            <div className="text-sm text-gray-500">
              Profile picture can be added after creating the child profile.
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                    Creating...
                  </span>
                ) : (
                  "Create Child Profile"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}