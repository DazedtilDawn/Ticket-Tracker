import { Express, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { AuthMiddleware } from "./auth";

// Configure storage for profile images
// Use a simpler, more direct storage implementation
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define the upload directory - keep it simple
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
    console.log('[PROFILE UPLOAD] Destination directory:', uploadDir);
    
    // Make sure the directory exists with proper permissions
    try {
      if (!fs.existsSync(uploadDir)) {
        console.log('[PROFILE UPLOAD] Creating directory');
        fs.mkdirSync(uploadDir, { recursive: true, mode: 0o777 });
        
        // Verify directory was created
        if (fs.existsSync(uploadDir)) {
          console.log('[PROFILE UPLOAD] Directory created successfully');
          
          // Make absolutely sure the permissions are set
          fs.chmodSync(uploadDir, 0o777);
        } else {
          console.error('[PROFILE UPLOAD] Failed to create directory');
        }
      } else {
        console.log('[PROFILE UPLOAD] Directory already exists');
        
        // Update permissions to ensure it's writable
        fs.chmodSync(uploadDir, 0o777);
      }
      
      // Try a test write to verify it's working
      const testFilePath = path.join(uploadDir, '.test-upload');
      fs.writeFileSync(testFilePath, 'test');
      if (fs.existsSync(testFilePath)) {
        console.log('[PROFILE UPLOAD] Test file created successfully');
        fs.unlinkSync(testFilePath);
        console.log('[PROFILE UPLOAD] Test file removed successfully');
      }
      
      // Proceed with upload
      cb(null, uploadDir);
    } catch (error) {
      console.error('[PROFILE UPLOAD] Error setting up upload directory:', error);
      // Pass error to multer
      cb(new Error(`Upload directory error: ${error instanceof Error ? error.message : String(error)}`), "");
    }
  },
  filename: (req, file, cb) => {
    try {
      // Log the incoming file
      console.log('[PROFILE UPLOAD] Processing file:', file.originalname, 'type:', file.mimetype);
      
      // Generate a simple unique filename with consistent extension handling
      const ext = path.extname(file.originalname || 'image.jpg').toLowerCase() || '.jpg';
      const uniqueId = uuidv4();
      const newFilename = `${uniqueId}${ext}`;
      
      console.log('[PROFILE UPLOAD] Generated filename:', newFilename);
      cb(null, newFilename);
    } catch (error) {
      console.error('[PROFILE UPLOAD] Error generating filename:', error);
      cb(new Error(`Filename error: ${error instanceof Error ? error.message : String(error)}`), "");
    }
  }
});

// Configure multer file filter for images
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (JPEG, PNG, GIF, WebP)"));
  }
};

// Create multer upload instance for profile images
export const profileUpload = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: imageFileFilter
});

export function registerProfileImageRoutes(app: Express) {
  // Profile image upload endpoint - parent only
  app.post("/api/profile-image/:userId", AuthMiddleware, (req: Request, res: Response) => {
    // Ensure user is a parent
    if (req.user?.role !== 'parent') {
      return res.status(403).json({ message: 'Only parents can upload profile images' });
    }
    
    const { userId } = req.params;
    console.log('[PROFILE UPLOAD] Starting upload for user:', userId);
    
    // Create the upload directory first to ensure it exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
    if (!fs.existsSync(uploadDir)) {
      console.log('[PROFILE UPLOAD] Creating upload directory');
      fs.mkdirSync(uploadDir, { recursive: true, mode: 0o777 });
    }
    
    // Verify directory permissions
    try {
      fs.accessSync(uploadDir, fs.constants.W_OK);
      console.log('[PROFILE UPLOAD] Directory is writable');
    } catch (err) {
      console.error('[PROFILE UPLOAD] Directory is not writable, changing permissions');
      fs.chmodSync(uploadDir, 0o777);
    }
    
    // Create a simple direct upload function
    const upload = profileUpload.single('profile_image');
    
    // Use multer to handle the file upload
    upload(req, res, async (err) => {
      if (err) {
        console.error('[PROFILE UPLOAD] Multer error:', err);
        return res.status(400).json({ 
          message: 'File upload error', 
          error: err.message
        });
      }
      
      try {
        // Check if the file was uploaded successfully
        if (!req.file) {
          console.error('[PROFILE UPLOAD] No file received in request');
          return res.status(400).json({ message: 'No image file provided' });
        }
        
        console.log('[PROFILE UPLOAD] File received:', req.file);
        
        // Get the path and verify the file exists
        const filename = req.file.filename;
        const fullPath = path.join(uploadDir, filename);
        const imageUrl = `/uploads/profiles/${filename}`;
        
        console.log('[PROFILE UPLOAD] File saved at:', fullPath);
        console.log('[PROFILE UPLOAD] Public URL will be:', imageUrl);
        
        // Verify the file was saved
        if (!fs.existsSync(fullPath)) {
          console.error('[PROFILE UPLOAD] File not saved to disk!');
          return res.status(500).json({ message: 'File upload failed - not saved to disk' });
        }
        
        try {
          // Update user record in database
          console.log('[PROFILE UPLOAD] Updating database for user:', userId);
          const result = await db.update(users)
            .set({ profile_image_url: imageUrl })
            .where(eq(users.id, parseInt(userId)));
          
          console.log('[PROFILE UPLOAD] Database update result:', result);
          
          // Respond with success and the URL client should use
          return res.status(200).json({ 
            success: true, 
            profile_image_url: imageUrl,
            message: 'Profile image uploaded successfully',
            filename: filename,
            timestamp: new Date().getTime() // Add timestamp for cache busting
          });
        } catch (dbError) {
          console.error('[PROFILE UPLOAD] Database error:', dbError);
          return res.status(500).json({ 
            message: 'Database error when updating profile image',
            error: dbError instanceof Error ? dbError.message : String(dbError)
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
      
      // Get user record
      const userResult = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(userId)));
      
      if (!userResult.length) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.status(200).json({ 
        profile_image_url: userResult[0].profile_image_url || null,
        user_id: userResult[0].id,
        name: userResult[0].name
      });
    } catch (error) {
      console.error('Error getting profile image:', error);
      return res.status(500).json({ message: 'Failed to get profile image' });
    }
  });
}