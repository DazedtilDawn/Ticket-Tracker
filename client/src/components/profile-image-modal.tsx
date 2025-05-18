import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CameraIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";

interface ProfileImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export default function ProfileImageModal({ isOpen, onClose, user }: ProfileImageModalProps) {
  const queryClient = useQueryClient();
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Function to handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Store the selected file
    setSelectedFile(file);
    
    // Preview the selected image immediately for instant feedback
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const previewData = e.target.result as string;
        setPreviewUrl(previewData);
      }
    };
    reader.readAsDataURL(file);
  };

  // Function to trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Function to upload the image
  const handleSaveImage = async () => {
    if (!selectedFile) {
      toast({
        title: "No image selected",
        description: "Please select an image first",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      console.log('Preparing to upload profile image for user:', user.id);
      
      // Create a new form data object
      const formData = new FormData();
      
      // Add the file with the exact name the server expects - this needs to match the server side
      // The field name must match the one expected in the server-side upload.single('profile_image') call
      formData.append('profile_image', selectedFile);
      
      // Add a timestamp to prevent caching issues
      const timestamp = new Date().getTime();
      const uploadUrl = `/api/profile-image/${user.id}?_t=${timestamp}`;
      
      console.log('Sending profile image upload request to:', uploadUrl);
      console.log('File being uploaded:', selectedFile.name, 'size:', selectedFile.size, 'type:', selectedFile.type);
      
      // Use fetch API for more reliable uploads with credentials
      console.log('Using fetch API for upload with credentials');
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies for authentication
        // Don't set Content-Type header, browser will set it correctly with boundary for multipart/form-data
      });
      
      console.log('Upload completed with status:', response.status);
      
      // Check if the upload was successful
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server returned error status:', response.status);
        console.error('Response text:', errorText);
        throw new Error(`Upload failed with status: ${response.status}. ${errorText}`);
      }
      
      let data;
      try {
        // Parse the successful response
        data = await response.json();
        console.log('Upload success response:', data);
      } catch (parseError) {
        console.error('Error parsing response JSON:', parseError);
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        throw new Error('Failed to parse server response');
      }
      
      if (data && data.profile_image_url) {
        // Add a timestamp to prevent browser caching of the image
        const imageUrlWithTimestamp = `${data.profile_image_url}?t=${timestamp}`;
        setPreviewUrl(imageUrlWithTimestamp);
        
        toast({
          title: "Profile image updated",
          description: "The profile image was updated successfully."
        });
        
        setUploadSuccess(true);
        
        // Invalidate ALL relevant queries to refresh data across the app
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/verify"] });
        
        // Force a reload of child-specific data if this is a child profile
        if (user.id !== 1) { // Assuming parent always has ID 1
          queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/stats`] });
        }
      } else {
        throw new Error('No profile image URL returned from server');
      }
    } catch (error) {
      console.error("Error uploading profile image:", error);
      
      // Reset the loading state
      setIsUploading(false);
      
      // Show error toast
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload the profile image. Please try again.",
        variant: "destructive"
      });
      
      return; // Exit early to prevent further processing
    }
    
    // Only reach here on success
    setIsUploading(false);
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile Image</DialogTitle>
          <DialogDescription>
            Upload a new profile image for {user.name}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6">
          <div className="relative inline-block group">
            <Avatar className="h-32 w-32 border-2 border-gray-200 dark:border-gray-700 cursor-pointer" onClick={handleUploadClick}>
              <AvatarImage 
                src={previewUrl || user.profile_image_url || undefined} 
                alt={`${user.name}'s profile`} 
              />
              <AvatarFallback className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute -bottom-1 -right-1 rounded-full shadow-md opacity-100 h-10 w-10 bg-primary-500 hover:bg-primary-600 text-white"
              onClick={handleUploadClick}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CameraIcon className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          <div className="text-center text-xs text-muted-foreground mt-2">
            Click to select a photo
          </div>
          
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          
          {uploadSuccess && (
            <p className="mt-4 text-sm text-green-600 font-medium">
              Profile image successfully updated!
            </p>
          )}
        </div>
        
        <DialogFooter className="flex justify-between">
          {!uploadSuccess ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={handleSaveImage} 
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Image'
                )}
              </Button>
            </>
          ) : (
            <Button variant="default" onClick={onClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}