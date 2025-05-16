import { useState, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ImageIcon, UploadIcon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Chore name must be at least 2 characters",
  }),
  description: z.string().optional(),
  tickets: z.coerce.number().int().min(1, {
    message: "Tickets must be at least 1",
  }),
  recurrence: z.enum(["daily", "weekly", "monthly"]),
  image_url: z.string().optional(),
  emoji: z.string().max(4, {
    message: "Emoji must be 4 characters or less"
  }).optional(),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface NewChoreDialogProps {
  children: React.ReactNode;
  chore?: any; // Optional chore for editing mode
  onChoreCreated: () => void;
}

export function NewChoreDialog({ children, chore, onChoreCreated }: NewChoreDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditMode = !!chore;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: chore?.name || "",
      description: chore?.description || "",
      tickets: chore?.tickets || 5,
      recurrence: chore?.recurrence || "daily",
      image_url: chore?.image_url || "",
      emoji: chore?.emoji || "",
      is_active: chore?.is_active !== undefined ? chore.is_active : true,
    },
  });
  
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // Get auth token from local storage
      const authStore = JSON.parse(localStorage.getItem('ticket-tracker-auth') || '{}');
      const token = authStore?.state?.token;
      
      // Manual fetch with token for FormData upload
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
          // Don't set content-type header for FormData
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      
      form.setValue('image_url', data.imageUrl);
      
      toast({
        title: "Image uploaded",
        description: "Image has been uploaded successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageUpload(e.target.files[0]);
    }
  };
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      if (isEditMode) {
        console.log("Sending chore update request:", data);
        await apiRequest(`/api/chores/${chore.id}`, {
          method: "PUT",
          body: data
        });
        toast({
          title: "Chore updated",
          description: "The chore has been updated successfully.",
        });
      } else {
        console.log("Sending chore create request:", data);
        await apiRequest("/api/chores", {
          method: "POST", 
          body: data
        });
        toast({
          title: "Chore created",
          description: "New chore has been added successfully.",
        });
      }
      
      onChoreCreated();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save chore",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Chore" : "Create New Chore"}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Update the details of this chore." 
              : "Add a new chore for children to complete."
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Clean Bedroom" {...field} />
                  </FormControl>
                  <FormDescription>
                    A clear name for the chore
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Make bed, tidy floor, organize desk" 
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Detailed instructions (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tickets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tickets</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Number of tickets earned for completing this chore
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="emoji"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emoji</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="e.g. 🧹 🧼 🧸" 
                          maxLength={4} 
                          {...field}
                          value={field.value || ""}
                        />
                        {field.value && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-2xl">
                            {field.value}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Optional emoji to represent this chore
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="recurrence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recurrence</FormLabel>
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How often this chore can be completed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chore Image</FormLabel>
                  <div className="space-y-2">
                    <div 
                      className={`border-2 border-dashed rounded-md p-4 transition-colors ${
                        isDragging 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-300 dark:border-gray-700'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center justify-center py-4 text-center">
                        {field.value ? (
                          <div className="relative w-full max-w-xs mx-auto">
                            <img 
                              src={field.value} 
                              alt="Chore preview" 
                              className="mx-auto max-h-32 object-contain rounded-md"
                              onError={() => {
                                toast({
                                  title: "Image error",
                                  description: "Could not load the image. Please try another URL.",
                                  variant: "destructive",
                                });
                                form.setValue('image_url', '');
                              }}
                            />
                            <button
                              type="button"
                              className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                form.setValue('image_url', '');
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <>
                            <UploadIcon className="w-12 h-12 text-gray-400 mb-2" />
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {isUploading ? (
                                <div className="flex items-center">
                                  <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-primary rounded-full"></span>
                                  Uploading...
                                </div>
                              ) : (
                                <>
                                  <span className="font-medium">Click to upload</span> or drag and drop
                                  <p>SVG, PNG, JPG or GIF (max. 5MB)</p>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input 
                          placeholder="Or enter image URL" 
                          {...field}
                          value={field.value || ""}
                          disabled={isUploading}
                        />
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileInputChange}
                          disabled={isUploading}
                        />
                      </div>
                    </FormControl>
                  </div>
                  <FormDescription>
                    An image that represents this chore (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Whether this chore is currently available
                    </FormDescription>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                    Saving...
                  </span>
                ) : isEditMode ? "Update Chore" : "Create Chore"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
