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
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Make sure the path is correct and accessible
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
    console.log('Destination directory for upload:', uploadDir);
    
    try {
      // Ensure upload directory exists with proper permissions
      if (!fs.existsSync(uploadDir)) {
        console.log('Creating directory:', uploadDir);
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('Directory created successfully');
      } else {
        console.log('Directory already exists');
        
        // Verify the directory permissions by writing a test file
        try {
          const testFile = path.join(uploadDir, '.test-write');
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
          console.log('Directory is writable');
        } catch (writeError) {
          console.error('Directory is not writable:', writeError);
          // Continue anyway, we'll handle the error downstream
        }
      }
      
      cb(null, uploadDir);
    } catch (error) {
      console.error('Error setting up upload directory:', error);
      cb(new Error(`Could not access upload directory: ${error.message}`), null);
    }
  },
  filename: (req, file, cb) => {
    try {
      const originalName = file.originalname || 'untitled';
      console.log('Original filename:', originalName);
      
      // Get file extension safely
      const fileExt = path.extname(originalName).toLowerCase() || '.jpg';
      console.log('File extension:', fileExt);
      
      // Generate a unique filename
      const fileName = `${uuidv4()}${fileExt}`;
      console.log('Generated filename:', fileName);
      
      cb(null, fileName);
    } catch (error) {
      console.error('Error generating filename:', error);
      cb(new Error(`Failed to process filename: ${error.message}`), null);
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
    console.log('Starting profile image upload for user:', userId);
    
    // Create a simple direct upload function
    const upload = profileUpload.single('profile_image');
    
    // Use multer to handle the file upload
    upload(req, res, async (err) => {
      if (err) {
        console.error('Multer error during upload:', err);
        return res.status(400).json({ 
          message: 'File upload error', 
          error: err.message
        });
      }
      
      try {
        // Check if the file was uploaded successfully
        if (!req.file) {
          console.error('No file was uploaded');
          return res.status(400).json({ message: 'No image file provided' });
        }
        
        console.log('File uploaded successfully:', req.file);
        
        // Use a simple direct path that we know works
        const filename = req.file.filename;
        const imageUrl = `/uploads/profiles/${filename}`;
        console.log('Image URL:', imageUrl);
        
        // Make sure DB update works properly
        try {
          // Update user record in database
          await db.update(users)
            .set({ profile_image_url: imageUrl })
            .where(eq(users.id, parseInt(userId)));
          
          console.log('Database updated with new profile image');
          
          // Respond with success
          return res.status(200).json({ 
            success: true, 
            profile_image_url: imageUrl,
            message: 'Profile image uploaded successfully',
            filename: filename
          });
        } catch (dbError) {
          console.error('Database error:', dbError);
          return res.status(500).json({ 
            message: 'Database error when updating profile image',
            error: dbError instanceof Error ? dbError.message : 'Unknown error'
          });
        }
      } catch (error) {
        console.error('Error in file processing:', error);
        return res.status(500).json({ 
          message: 'Failed to process uploaded file',
          error: error instanceof Error ? error.message : 'Unknown error'
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