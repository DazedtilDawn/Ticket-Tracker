import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CameraIcon, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface ProfileImageUploadProps {
  userId: number;
  name: string;
  currentImageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  onImageUpdated?: (imageUrl: string) => void;
}

export default function ProfileImageUpload({ 
  userId, 
  name,
  currentImageUrl,
  size = "md",
  onImageUpdated 
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Determine avatar size based on prop
  const avatarSizeClass = {
    sm: "h-10 w-10",
    md: "h-20 w-20",
    lg: "h-32 w-32"
  }[size];
  
  const buttonSizeClass = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  }[size];
  
  const iconSizeClass = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  }[size];
  
  // Function to handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Preview the selected image
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Upload the image
    await uploadImage(file);
  };
  
  // Function to upload the image
  const uploadImage = async (file: File) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('profile_image', file);
      
      const response = await apiRequest(`/api/profile-image/${userId}`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type, let the browser set it with the boundary
        headers: {}
      });
      
      if (response && response.profile_image_url) {
        toast({
          title: "Profile image updated",
          description: "The profile image was updated successfully."
        });
        
        // Call the callback if provided
        if (onImageUpdated) {
          onImageUpdated(response.profile_image_url);
        }
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      }
    } catch (error) {
      console.error("Error uploading profile image:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload the profile image. Please try again.",
        variant: "destructive"
      });
      
      // Reset preview on error
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Function to trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  // Generate initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <div className="relative inline-block group">
      <Avatar className={`${avatarSizeClass} border-2 border-gray-200 dark:border-gray-700`}>
        <AvatarImage 
          src={previewUrl || currentImageUrl || undefined} 
          alt={`${name}'s profile`} 
        />
        <AvatarFallback className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className={`absolute -bottom-1 -right-1 rounded-full shadow-md opacity-90 group-hover:opacity-100 ${buttonSizeClass} bg-primary-500 hover:bg-primary-600 text-white`}
        onClick={handleUploadClick}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className={`${iconSizeClass} animate-spin`} />
        ) : (
          <CameraIcon className={iconSizeClass} />
        )}
      </Button>
      
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}