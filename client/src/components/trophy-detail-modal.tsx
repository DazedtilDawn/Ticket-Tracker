import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Camera, Upload, Pencil, TicketIcon } from "lucide-react";

interface TrophyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  trophy: TrophyItem; 
  userId: number | undefined;
}

interface TrophyItem {
  id: number;
  title: string;
  imageUrl: string;
  purchaseDate: string;
  ticketCost: number;
  transactionId: number;
  happiness?: number;
  note?: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Trophy name is required"),
  description: z.string().optional(),
  transaction_id: z.number(),
  user_id: z.number(),
});

type FormValues = z.infer<typeof formSchema>;

export function TrophyDetailModal({ isOpen, onClose, trophy, userId }: TrophyDetailModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [useCatalogImage, setUseCatalogImage] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: trophy?.title || "",
      description: trophy?.note || "",
      transaction_id: trophy?.transactionId || 0,
      user_id: userId || 0,
    },
  });

  const updateTrophyMutation = useMutation({
    mutationFn: async (data: FormValues & { image?: File }) => {
      // Log what we're sending to help with debugging
      console.log("Trophy update data:", {
        transactionId: data.transaction_id,
        name: data.name,
        description: data.description || "",
        userId: data.user_id,
        hasImage: !!data.image,
        imageType: data.image?.type,
        imageSize: data.image?.size
      });
      
      const formData = new FormData();
      formData.append("transaction_id", data.transaction_id.toString());
      formData.append("name", data.name);
      // We need to handle description differently since the server API accepts it
      // But will merge it with name into the note field
      formData.append("description", data.description || "");
      formData.append("user_id", data.user_id.toString());
      
      if (data.image) {
        formData.append("image", data.image);
      }

      return apiRequest("/api/trophies/update", {
        method: "POST",
        body: formData,
        // Don't set Content-Type, let the browser set it with the boundary
      });
    },
    onSuccess: () => {
      toast({
        title: "Trophy updated!",
        description: "Your trophy has been customized successfully.",
      });
      
      // Invalidate all relevant queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      // Clear form and close modal
      onClose();
    },
    onError: (error: any) => {
      console.error("Trophy update error:", error);
      toast({
        title: "Error updating trophy",
        description: "There was a problem updating your trophy. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: FormValues) => {
    updateTrophyMutation.mutate({
      ...values,
      image: selectedFile || undefined,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUseCatalogImage(false);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Customize Your Trophy</DialogTitle>
          <DialogDescription>
            Personalize your trophy with a custom name, description, or image.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trophy Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Special Trophy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Description/Note</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add a special note about this trophy..."
                          className="h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Add a personal note about this achievement
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <Card className="overflow-hidden">
                  <div className="h-40 overflow-hidden relative">
                    <img
                      src={previewUrl || trophy?.imageUrl}
                      alt={trophy?.title}
                      className="w-full h-full object-contain object-center"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder-product.png";
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <Badge className="bg-amber-500 hover:bg-amber-600">
                        <TicketIcon className="h-3 w-3 mr-1" />
                        {trophy?.ticketCost} tickets
                      </Badge>
                    </div>
                  </div>
                </Card>

                <div className="space-y-3">
                  <Label htmlFor="picture" className="block text-sm font-medium">
                    Trophy Image
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => document.getElementById("image-upload")?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateTrophyMutation.isPending}
              >
                {updateTrophyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Save Trophy
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}