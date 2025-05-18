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
    
    // Set uploading state to true immediately for visual feedback
    setIsUploading(true);
    
    // Preview the selected image immediately for instant feedback
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const previewData = e.target.result as string;
        setPreviewUrl(previewData);
        console.log('Local preview image set');
      }
    };
    reader.readAsDataURL(file);
    
    try {
      // Upload the image after local preview is set
      console.log('Uploading file:', file.name);
      await uploadImage(file);
    } catch (error) {
      console.error('Error during image upload:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload the profile image. Please try again.",
        variant: "destructive"
      });
      setIsUploading(false);
    }
  };
  
  // Function to upload the image
  const uploadImage = async (file: File) => {
    // We're already setting isUploading in handleFileChange, but set it again just to be safe
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('profile_image', file);
      
      console.log('Uploading image for user:', userId);
      
      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await apiRequest(`/api/profile-image/${userId}?_t=${timestamp}`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type, let the browser set it with the boundary
        headers: {}
      });
      
      console.log('Upload response:', response);
      
      if (response && response.profile_image_url) {
        // Update the preview URL with the actual server URL (includes the full path)
        // Add a timestamp to prevent browser caching of the image
        const imageUrlWithTimestamp = `${response.profile_image_url}?t=${timestamp}`;
        setPreviewUrl(imageUrlWithTimestamp);
        
        toast({
          title: "Profile image updated",
          description: "The profile image was updated successfully."
        });
        
        // Call the callback if provided
        if (onImageUpdated) {
          onImageUpdated(response.profile_image_url);
        }
        
        // Invalidate ALL relevant queries to refresh data across the app
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/verify"] });
        
        // Force a reload of child-specific data if this is a child profile
        if (userId !== 1) { // Assuming parent always has ID 1
          queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/stats`] });
        }
      } else {
        throw new Error('No profile image URL returned from server');
      }
    } catch (error) {
      console.error("Error uploading profile image:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload the profile image. Please try again.",
        variant: "destructive"
      });
      
      // Don't reset preview on error - let them see what they tried to upload
      // This way they can see if it was the right image they selected
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
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-block group">
        <Avatar className={`${avatarSizeClass} border-2 border-gray-200 dark:border-gray-700 cursor-pointer`} onClick={handleUploadClick}>
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
          className={`absolute -bottom-1 -right-1 rounded-full shadow-md opacity-100 animate-pulse ${buttonSizeClass} bg-primary-500 hover:bg-primary-600 text-white`}
          onClick={handleUploadClick}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className={`${iconSizeClass} animate-spin`} />
          ) : (
            <CameraIcon className={iconSizeClass} />
          )}
        </Button>
      </div>
      
      <div className="text-center text-xs text-muted-foreground">
        {size === "lg" && "Click to upload photo"}
      </div>
      
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