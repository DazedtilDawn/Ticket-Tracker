import { Express, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { AuthMiddleware } from "./auth";
import { upload, saveUploadedFile } from "./upload";

export function registerProfileImageRoutes(app: Express) {
  // Profile image upload endpoint - parent only
  app.post("/api/profile-image/:userId", AuthMiddleware, (req: Request, res: Response) => {
    // Ensure user is a parent
    if (req.user?.role !== 'parent') {
      return res.status(403).json({ message: 'Only parents can upload profile images' });
    }
    
    const { userId } = req.params;
    console.log('[PROFILE UPLOAD] Starting upload for user:', userId);
    
    // Use the memory-based upload middleware
    const uploadMiddleware = upload.single('profile_image');
    
    // Process the upload
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        console.error('[PROFILE UPLOAD] Upload error:', err);
        return res.status(400).json({ 
          message: 'File upload error', 
          error: err.message 
        });
      }
      
      try {
        // Check if the file was uploaded successfully
        if (!req.file || !req.file.buffer) {
          console.error('[PROFILE UPLOAD] No file received in request');
          return res.status(400).json({ message: 'No image file provided' });
        }
        
        console.log('[PROFILE UPLOAD] File received:', {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        });
        
        try {
          // Save the file from memory to disk and get the URL
          const imageUrl = saveUploadedFile(req.file);
          console.log('[PROFILE UPLOAD] File saved successfully, URL:', imageUrl);
          
          // Update user record in database
          console.log('[PROFILE UPLOAD] Updating database for user:', userId);
          await db.update(users)
            .set({ profile_image_url: imageUrl })
            .where(eq(users.id, parseInt(userId)));
          
          console.log('[PROFILE UPLOAD] Database updated successfully');
          
          // Add timestamp to prevent browser caching
          const cacheBustUrl = `${imageUrl}?t=${new Date().getTime()}`;
          
          // Respond with success
          return res.status(200).json({ 
            success: true, 
            profile_image_url: cacheBustUrl,
            message: 'Profile image uploaded successfully'
          });
        } catch (saveError) {
          console.error('[PROFILE UPLOAD] Error saving file:', saveError);
          return res.status(500).json({ 
            message: 'Failed to save image file',
            error: saveError instanceof Error ? saveError.message : String(saveError)
          });
        }
      } catch (error) {
        console.error('[PROFILE UPLOAD] Processing error:', error);
        return res.status(500).json({ 
          message: 'Failed to process uploaded file',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
  });
  
  // Get user profile image
  app.get("/api/profile-image/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Get user from database
      const userResult = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(userId)));
      
      if (userResult.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const user = userResult[0];
      
      if (!user.profile_image_url) {
        return res.status(404).json({ message: 'User has no profile image' });
      }
      
      return res.json({ 
        profile_image_url: user.profile_image_url,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error retrieving profile image:', error);
      return res.status(500).json({ 
        message: 'Failed to retrieve profile image',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}