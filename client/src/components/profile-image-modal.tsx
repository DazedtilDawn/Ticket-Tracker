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
    // Safety checks
    if (!selectedFile) {
      toast({
        title: "No image selected",
        description: "Please select an image first",
        variant: "destructive"
      });
      return;
    }
    
    // Prevent double submissions
    if (isUploading) {
      console.log('Upload already in progress, preventing duplicate request');
      return;
    }
    
    // Set uploading state immediately to prevent multiple attempts
    setIsUploading(true);
    
    // Track upload completion status
    let uploadCompleted = false;
    let autoCloseTimeout: NodeJS.Timeout | null = null;
    
    try {
      console.log('Preparing upload for user:', user.id);
      
      // Create form data
      const formData = new FormData();
      formData.append('profile_image', selectedFile);
      
      // Add cache-busting timestamp
      const timestamp = new Date().getTime();
      const uploadUrl = `/api/profile-image/${user.id}?_t=${timestamp}`;
      
      console.log('Uploading file:', selectedFile.name, 'size:', selectedFile.size);
      
      // Create abort controller with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Upload timeout triggered, aborting request');
        controller.abort();
      }, 15000); // 15 second timeout
      
      // Execute the upload
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        signal: controller.signal
      });
      
      // Clear abort timeout
      clearTimeout(timeoutId);
      
      console.log('Upload response status:', response.status);
      
      // Handle error responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText.substring(0, 100)}`);
      }
      
      // Parse the response
      const data = await response.json();
      console.log('Server success response:', data);
      
      // Validate response structure
      if (!data || !data.success) {
        throw new Error(data?.message || 'Upload failed - server indicated failure');
      }
      
      // Process successful upload
      if (data.profile_image_url || data.public_url) {
        // Set success flag to prevent state reset in finally block
        uploadCompleted = true;
        
        // Update UI with new image (prefer public_url if available)
        const imageUrl = data.public_url || `${data.profile_image_url}?t=${timestamp}`;
        setPreviewUrl(imageUrl);
        setUploadSuccess(true);
        
        // Log success details
        console.log('Image upload succeeded with URL:', imageUrl);
        
        // Notify user
        toast({
          title: "Success",
          description: "Profile image updated successfully"
        });
        
        // Refresh all relevant data across the application
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/verify"] });
        
        if (user.id !== 1) {
          queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/stats`] });
        }
        
        // Auto-close after success with a delay - store the timeout ID
        console.log('Scheduling auto-close of modal in 800ms');
        autoCloseTimeout = setTimeout(() => {
          console.log('Auto-closing profile image modal after successful upload');
          // Force modal closure
          onClose();
        }, 800);
      } else {
        console.error('Response missing image URL in data:', data);
        throw new Error('No image URL in server response');
      }
    } catch (error: any) {
      // Error handling
      console.error("Upload error details:", error);
      
      // Clear any existing timeout to prevent auto-close after error
      if (autoCloseTimeout) {
        clearTimeout(autoCloseTimeout);
      }
      
      // Show user-friendly error message
      toast({
        title: "Upload failed",
        description: error?.message || "Could not upload image",
        variant: "destructive"
      });
      
      // Always set uploadCompleted to false on error
      uploadCompleted = false;
    } finally {
      // Always reset loading state
      setIsUploading(false);
      
      // Only reset success state if upload didn't complete
      if (!uploadCompleted) {
        setUploadSuccess(false);
      }
    }
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