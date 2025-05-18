import { Express, Request, Response } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { AuthMiddleware } from "./auth";
import { upload, getFileUrl } from "./file-upload";

export function registerProfileImageRoutes(app: Express) {
  // Profile image upload endpoint - parent only
  app.post("/api/profile-image/:userId", AuthMiddleware, (req: Request, res: Response) => {
    console.log('Profile image upload request received');
    
    // Ensure user is a parent
    if (req.user?.role !== 'parent') {
      return res.status(403).json({ message: 'Only parents can upload profile images' });
    }
    
    const { userId } = req.params;
    console.log(`Profile image upload for user: ${userId}`);
    
    // Use the upload middleware with disk storage
    const uploadMiddleware = upload.single('profile_image');
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ 
          message: 'File upload error', 
          error: err.message 
        });
      }
      
      try {
        if (!req.file) {
          console.error('No file received in request');
          return res.status(400).json({ message: 'No image file provided' });
        }
        
        console.log('File uploaded successfully:', {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          filename: req.file.filename,
          path: req.file.path,
          size: req.file.size
        });
        
        // Get the file URL
        const imageUrl = getFileUrl(req.file);
        console.log('Image URL:', imageUrl);
        
        try {
          // Update user record in database
          await db.update(users)
            .set({ profile_image_url: imageUrl })
            .where(eq(users.id, parseInt(userId)));
          
          console.log('Database updated successfully');
          
          // Add cache-busting timestamp
          const timestamp = new Date().getTime();
          const cacheBustedUrl = `${imageUrl}?t=${timestamp}`;
          
          // Return success
          return res.status(200).json({ 
            success: true, 
            profile_image_url: cacheBustedUrl,
            message: 'Profile image uploaded successfully'
          });
        } catch (dbError) {
          console.error('Database error:', dbError);
          return res.status(500).json({ 
            message: 'Database error when updating profile image',
            error: dbError instanceof Error ? dbError.message : String(dbError)
          });
        }
      } catch (error) {
        console.error('Error processing upload:', error);
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