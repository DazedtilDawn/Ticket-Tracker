import { useState, useRef } from "react";
import { format } from "date-fns";
import { useAuthStore } from "@/store/auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ImageIcon, UploadIcon, UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DashboardBannerProps {
  defaultBannerColor?: string;
}

export default function DashboardBanner({ defaultBannerColor = "bg-gradient-to-r from-primary-500/30 via-primary-400/20 to-primary-300/30" }: DashboardBannerProps) {
  const { user } = useAuthStore();
  const authStore = useAuthStore(); // Get the full store to access refreshUser
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Calculate initials for fallback
  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      ?.map((n) => n[0])
      ?.join("")
      ?.toUpperCase()
      ?.substring(0, 2) || "?";
  };
  
  // Opens the file picker when clicked
  const handleBannerButtonClick = () => {
    if (isEditMode) {
      setIsEditMode(false);
      return;
    }
    
    // Trigger file input click
    setIsEditMode(true);
    
    // After a short delay to ensure the DOM is updated
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }, 100);
  };
  
  // Handles the actual file upload when a file is selected
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Only allow images
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }
    
    // File size check (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('bannerImage', file);
      
      // Send the file to the banner image endpoint
      const response = await fetch('/api/users/banner-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload banner image');
      }
      
      // Get the updated user data
      await authStore.refreshUser();
      
      toast({
        title: "Banner image updated",
        description: "Your dashboard banner has been updated successfully",
      });
    } catch (error) {
      console.error('Error uploading banner image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload banner image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setIsEditMode(false);
    }
  };
  
  return (
    <div className="relative overflow-hidden rounded-lg shadow-sm mb-6">
      {/* Banner image or gradient background */}
      <div 
        className={`relative w-full h-32 sm:h-48 ${defaultBannerColor} overflow-hidden`}
        style={{
          // Use banner image if available, otherwise use profile image as fallback, or default gradient
          backgroundImage: user?.banner_image_url 
            ? `url(${user.banner_image_url})` 
            : user?.profile_image_url 
              ? `url(${user.profile_image_url})` 
              : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Edit banner button (only visible for self or parent) */}
        {(user?.role === "child" || user?.role === "parent") && (
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700"
            onClick={handleBannerButtonClick}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <div className="animate-spin mr-1 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                Uploading...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-1" />
                {isEditMode ? "Cancel" : "Change Banner"}
              </>
            )}
          </Button>
        )}
        
        {/* File input - hidden but accessible via the button */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        
        {/* Banner upload UI - shown when in edit mode */}
        {isEditMode && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
            <div className="text-center">
              <Button
                variant="default"
                className="bg-white text-gray-800 hover:bg-gray-100"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <UploadIcon className="w-4 h-4 mr-2" />
                Choose Banner Image
              </Button>
              <p className="text-white text-sm mt-2">Recommended size: 1200×300 pixels</p>
              <p className="text-white/70 text-xs mt-1">This will be your dashboard banner background</p>
            </div>
          </div>
        )}
        
        {/* Profile information overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent text-white flex items-end">
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16 border-2 border-white shadow-md">
              <AvatarImage 
                src={user?.profile_image_url || undefined} 
                alt={`${user?.name}'s profile`}
              />
              <AvatarFallback className="bg-primary-600 text-white">
                {user?.name ? getInitials(user.name) : "?"}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-xl font-bold">{user?.name || "Dashboard"}</h1>
              <p className="text-sm text-gray-200">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
              
              {/* Show "viewing as" message in the banner for viewing child as parent */}
              {user?.role === "parent" && useAuthStore.getState().isViewingAsChild() && (
                <div className="text-xs bg-amber-500/60 text-white px-2 py-1 rounded-full mt-1 inline-flex items-center">
                  <UserIcon className="h-3 w-3 mr-1" />
                  Managing {user?.name}'s account
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}