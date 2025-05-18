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
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  // Reset state when modal is closed
  React.useEffect(() => {
    if (!isOpen) {
      // Clear any pending timeouts
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      
      // Reset state after modal is closed
      setSelectedFile(null);
      setUploadSuccess(false);
      setIsUploading(false);
    }
  }, [isOpen]);

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

  /**
   * Completely new implementation of the profile image upload function
   * This fixes the perpetual saving loop issue by using a controlled state flow
   * and ensuring proper handling of components throughout the lifecycle
   */
  const handleSaveImage = async () => {
    // Step 1: Basic validation
    if (!selectedFile) {
      toast({
        title: "No image selected",
        description: "Please select an image first",
        variant: "destructive"
      });
      return;
    }
    
    // Step 2: Prevent duplicate uploads
    if (isUploading) {
      console.log('[UPLOAD] Already in progress, ignoring duplicate request');
      return;
    }
    
    try {
      // Step 3: Set the uploading state FIRST - this is critical
      setIsUploading(true);
      setUploadSuccess(false);
      
      // Step 4: Prepare upload data
      console.log(`[UPLOAD] Starting upload for ${user.name} (ID: ${user.id})`);
      
      const formData = new FormData();
      formData.append('profile_image', selectedFile);
      
      // Use the generic upload endpoint used for chore images instead
      const uploadUrl = `/api/upload/image`;
      
      // Log details for debugging
      console.log(`[UPLOAD] File: ${selectedFile.name}, Size: ${selectedFile.size} bytes`);
      
      // Add the user_id to the form data to identify which user this image is for
      formData.append('user_id', user.id.toString());
      
      // Setup automatic timeout (prevents hanging)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('[UPLOAD] Request timeout, aborting');
        controller.abort();
      }, 15000); // 15-second timeout (slightly longer)
      
      // Execute the actual upload using the same endpoint as chore images
      console.log(`[UPLOAD] POST request to ${uploadUrl}`);
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        signal: controller.signal
      });
      
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      
      // Step 7: Handle response
      console.log(`[UPLOAD] Response status: ${response.status}`);
      
      if (!response.ok) {
        // Handle error response
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText.substring(0, 100)}`);
      }
      
      // Step 8: Parse and validate the JSON response
      const data = await response.json();
      console.log('[UPLOAD] Server response:', data);
      
      if (!data) {
        throw new Error('Empty response from server');
      }
      
      if (!data.success && !data.imageUrl) {
        throw new Error(data?.message || 'Server indicated failure');
      }
      
      // Step 9: Process success - CRITICAL PART FOR FIXING THE LOOP
      // Extract image URL from any of the possible response formats
      let imageUrl = null;
      
      // Try all possible fields where the URL might be located
      if (data.public_url) {
        imageUrl = data.public_url;
      } else if (data.profile_image_url) {
        imageUrl = data.profile_image_url;
      } else if (data.imageUrl) {
        imageUrl = data.imageUrl;
      }
      
      // Still no URL? Throw an error
      if (!imageUrl) {
        throw new Error('No image URL in server response');
      }
      
      // Add timestamp for cache busting if not already present
      const currentTime = Date.now();
      if (!imageUrl.includes('?t=')) {
        imageUrl = `${imageUrl}?t=${currentTime}`;
      }
      
      console.log('[UPLOAD] Final image URL with cache busting:', imageUrl);
      setPreviewUrl(imageUrl);
      
      // Mark the upload as successful
      setUploadSuccess(true);
      console.log('[UPLOAD] Success! Image URL:', imageUrl);
      
      // Notify the user
      toast({
        title: "Success!",
        description: "Profile image updated successfully"
      });
      
      // Refresh related data
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/verify"] });
      
      if (user.id !== 1) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/stats`] });
      }
      
      // Auto-close after success with a delay
      console.log('[UPLOAD] Scheduling auto-close');
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      
      closeTimeoutRef.current = setTimeout(() => {
        console.log('[UPLOAD] Auto-closing modal after successful upload');
        onClose();
      }, 1200);
      
    } catch (error: any) {
      // Step 10: Error handling
      console.error('[UPLOAD] Error:', error);
      
      // Cancel any pending close
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      
      // Reset success state
      setUploadSuccess(false);
      
      // Show error to user
      toast({
        title: "Upload failed",
        description: error?.message || "Could not upload image",
        variant: "destructive"
      });
    } finally {
      // Step 11: Always clean up by resetting the uploading state
      // This happens regardless of success or failure
      setIsUploading(false);
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