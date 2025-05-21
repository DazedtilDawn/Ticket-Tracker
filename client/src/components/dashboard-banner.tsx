import { useState } from "react";
import { format } from "date-fns";
import { useAuthStore } from "@/store/auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ImageIcon, Edit2Icon } from "lucide-react";

interface DashboardBannerProps {
  defaultBannerColor?: string;
}

export default function DashboardBanner({ defaultBannerColor = "bg-gradient-to-r from-primary-500/30 via-primary-400/20 to-primary-300/30" }: DashboardBannerProps) {
  const { user } = useAuthStore();
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Calculate initials for fallback
  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      ?.map((n) => n[0])
      ?.join("")
      ?.toUpperCase()
      ?.substring(0, 2) || "?";
  };
  
  // For future implementation - this would handle banner image upload
  const handleBannerUpload = () => {
    // Future implementation - would open file picker and upload banner image
    setIsEditMode(false);
  };
  
  return (
    <div className="relative overflow-hidden rounded-lg shadow-sm mb-6">
      {/* Banner image or gradient background */}
      <div 
        className={`relative w-full h-32 sm:h-48 ${defaultBannerColor} overflow-hidden`}
        style={{
          // Using profile image as a background if available, otherwise use the default gradient
          backgroundImage: user?.profile_image_url ? `url(${user.profile_image_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Edit banner button (only visible for self or parent) */}
        {(user?.role === "child" || user?.role === "parent") && (
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            <ImageIcon className="w-4 h-4 mr-1" />
            {isEditMode ? "Cancel" : "Change Banner"}
          </Button>
        )}
        
        {/* Banner upload UI - would be implemented in the future */}
        {isEditMode && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
            <div className="text-center">
              <Button
                variant="default"
                className="bg-white text-gray-800 hover:bg-gray-100"
                onClick={handleBannerUpload}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Choose Banner Image
              </Button>
              <p className="text-white text-sm mt-2">Recommended size: 1200×300 pixels</p>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}