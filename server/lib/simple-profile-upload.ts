import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Express, Request, Response } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { AuthMiddleware } from './auth';

// Set up profile image upload directory
const profilesDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');

// Ensure directory exists
if (!fs.existsSync(profilesDir)) {
  console.log(`Creating profiles directory: ${profilesDir}`);
  fs.mkdirSync(profilesDir, { recursive: true, mode: 0o777 });
} else {
  // Make sure permissions are set correctly
  fs.chmodSync(profilesDir, 0o777);
  console.log(`Using existing profiles directory with updated permissions: ${profilesDir}`);
}

// Configure disk storage for simplicity and reliability
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    console.log(`Saving profile image to: ${profilesDir}`);
    // Verify directory exists before attempting to save
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
    }
    cb(null, profilesDir);
  },
  filename: function(req, file, cb) {
    // Create a unique filename with the original extension
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueFilename = `${uuidv4()}${ext}`;
    console.log(`Generated filename: ${uniqueFilename}`);
    cb(null, uniqueFilename);
  }
});

// Create the multer upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'), false);
    }
  }
});

// Register profile image routes
export function registerProfileImageRoutes(app: Express) {
  // Profile image upload endpoint - parent only
  app.post('/api/profile-image/:userId', AuthMiddleware, (req: Request, res: Response) => {
    console.log('Profile image upload request received');
    
    // Ensure user is a parent
    if (req.user?.role !== 'parent') {
      return res.status(403).json({ message: 'Only parents can upload profile images' });
    }
    
    const { userId } = req.params;
    console.log(`Processing profile image upload for user: ${userId}`);
    
    // Use multer upload middleware
    upload.single('profile_image')(req, res, async (err) => {
      if (err) {
        console.error('Upload middleware error:', err);
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      // Check if file was uploaded
      if (!req.file) {
        console.error('No file received in upload request');
        return res.status(400).json({
          success: false,
          message: 'No file was uploaded'
        });
      }
      
      try {
        console.log('File saved to disk:', req.file.path);
        
        // Get the public URL for the image
        const publicUrl = `/uploads/profiles/${req.file.filename}`;
        console.log('Public URL:', publicUrl);
        
        // Update the user's profile image URL in the database
        await db.update(users)
          .set({ profile_image_url: publicUrl })
          .where(eq(users.id, parseInt(userId)));
        
        console.log('Database updated with new profile image URL');
        
        // Add cache-busting
        const cacheBustUrl = `${publicUrl}?t=${Date.now()}`;
        
        // Return success response
        return res.status(200).json({
          success: true,
          message: 'Profile image uploaded successfully',
          profile_image_url: cacheBustUrl
        });
      } catch (error) {
        console.error('Error saving profile image:', error);
        return res.status(500).json({
          success: false,
          message: 'Server error while processing profile image',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  });
  
  // Get user profile image
  app.get('/api/profile-image/:userId', async (req: Request, res: Response) => {
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