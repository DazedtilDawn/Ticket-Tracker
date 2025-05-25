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
import { UserCog } from "lucide-react";

const editChildSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
});

type EditChildFormData = z.infer<typeof editChildSchema>;

interface Child {
  id: number;
  name: string;
  username: string;
  profile_image_url?: string | null;
  banner_color_preference?: string;
}

interface EditChildDialogProps {
  child: Child;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditChildDialog({ child, open, onOpenChange }: EditChildDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const refreshFamilyUsers = useAuthStore((state) => state.refreshFamilyUsers);

  const form = useForm<EditChildFormData>({
    resolver: zodResolver(editChildSchema),
    defaultValues: {
      name: child.name,
    },
  });

  // Reset form when child changes
  useEffect(() => {
    form.reset({
      name: child.name,
    });
  }, [child, form]);

  const updateChildMutation = useMutation({
    mutationFn: async (data: EditChildFormData) => {
      const response = await apiRequest(`/api/family/children/${child.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Child profile updated successfully",
      });
      
      // Invalidate the children query to refresh the list
      await queryClient.invalidateQueries({ queryKey: ["/api/family/children"] });
      
      // Refresh family users in auth store
      if (refreshFamilyUsers) {
        await refreshFamilyUsers();
      }
      
      // Close dialog
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update child profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: EditChildFormData) => {
    setIsSubmitting(true);
    try {
      await updateChildMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserCog className="mr-2 h-5 w-5" />
            Edit Child Profile
          </DialogTitle>
          <DialogDescription>
            Update {child.name}'s profile information.
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

            <div className="text-sm text-gray-500">
              Profile picture editing will be available in a future update.
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
                    Updating...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}