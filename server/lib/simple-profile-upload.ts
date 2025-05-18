import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Express, Request, Response } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { AuthMiddleware } from './auth';
import cors from 'cors';

// Simple profile image handler - completely rewritten for reliability
export function registerProfileImageRoutes(app: Express) {
  // Configure upload directory
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  const profilesDir = path.join(uploadDir, 'profiles');
  
  // Ensure directories exist with proper permissions
  [uploadDir, profilesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
    } else {
      console.log(`Using existing directory: ${dir}`);
      fs.chmodSync(dir, 0o777);
    }
  });
  
  // Set up multer with memory storage for better reliability
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      // Only accept images
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    }
  });
  
  // Enable CORS for image endpoints
  app.use('/api/profile-image/:userId', cors());
  
  // Profile image upload endpoint (parent only)
  app.post('/api/profile-image/:userId', AuthMiddleware, (req: Request, res: Response) => {
    console.log('[PROFILE] Upload request received');
    
    // Ensure user is a parent
    if (req.user?.role !== 'parent') {
      console.log('[PROFILE] Permission denied - user is not a parent');
      return res.status(403).json({ 
        success: false, 
        message: 'Only parents can upload profile images' 
      });
    }
    
    const { userId } = req.params;
    if (!userId || isNaN(parseInt(userId))) {
      console.log('[PROFILE] Invalid user ID:', userId);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID' 
      });
    }
    
    console.log(`[PROFILE] Processing upload for user ID: ${userId}`);
    
    // Handle the file upload
    upload.single('profile_image')(req, res, async (err) => {
      if (err) {
        console.error('[PROFILE] Upload error:', err);
        return res.status(400).json({ 
          success: false, 
          message: `Upload error: ${err.message}` 
        });
      }
      
      if (!req.file || !req.file.buffer) {
        console.error('[PROFILE] No file received');
        return res.status(400).json({ 
          success: false, 
          message: 'No file was uploaded' 
        });
      }
      
      try {
        // Log file details
        console.log('[PROFILE] Received file:', {
          name: req.file.originalname,
          type: req.file.mimetype,
          size: req.file.size
        });
        
        // Generate a unique filename
        const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
        const filename = `${uuidv4()}${ext}`;
        const filePath = path.join(profilesDir, filename);
        
        // Save the file from buffer to disk
        fs.writeFileSync(filePath, req.file.buffer);
        console.log(`[PROFILE] File saved to: ${filePath}`);
        
        // Verify the file was saved
        if (!fs.existsSync(filePath)) {
          throw new Error('File could not be saved to disk');
        }
        
        // Set correct file permissions
        fs.chmodSync(filePath, 0o666);
        
        // Generate the public URL for the image
        const publicUrl = `/uploads/profiles/${filename}`;
        
        try {
          // Update user profile in database
          await db.update(users)
            .set({ profile_image_url: publicUrl })
            .where(eq(users.id, parseInt(userId)));
          
          console.log(`[PROFILE] Database updated for user: ${userId}`);
          
          // Add cache-busting timestamp
          const timestamp = new Date().getTime();
          const cacheBustUrl = `${publicUrl}?t=${timestamp}`;
          
          // Send success response
          return res.status(200).json({
            success: true,
            message: 'Profile image uploaded successfully',
            profile_image_url: cacheBustUrl
          });
        } catch (dbError) {
          console.error('[PROFILE] Database error:', dbError);
          return res.status(500).json({
            success: false,
            message: 'Database error updating profile'
          });
        }
      } catch (error) {
        console.error('[PROFILE] Error processing file:', error);
        return res.status(500).json({
          success: false,
          message: 'Server error processing image',
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
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      const user = userResult[0];
      
      if (!user.profile_image_url) {
        return res.status(404).json({ 
          success: false, 
          message: 'User has no profile image' 
        });
      }
      
      return res.json({ 
        success: true,
        profile_image_url: user.profile_image_url,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('[PROFILE] Error retrieving profile:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Failed to retrieve profile image'
      });
    }
  });
}