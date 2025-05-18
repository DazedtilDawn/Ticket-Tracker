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

// Simple profile image handler using direct file system access
export function registerProfileImageRoutes(app: Express) {
  console.log('[PROFILE] Setting up profile image upload handler');
  
  // Configure upload directory
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  const profilesDir = path.join(uploadDir, 'profiles');
  
  // Ensure upload directories exist with proper permissions
  [uploadDir, profilesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
    } else {
      console.log(`Using existing directory: ${dir}`);
      // Make sure permissions are correctly set
      try {
        fs.chmodSync(dir, 0o777);
      } catch (err) {
        console.error(`[PROFILE] Error setting permissions for ${dir}:`, err);
      }
    }
  });
  
  // Create a temporary test file to verify write permissions
  try {
    const testFile = path.join(profilesDir, `test-${Date.now()}.txt`);
    fs.writeFileSync(testFile, 'test file to verify write permissions');
    console.log(`[PROFILE] Test file created successfully at ${testFile}`);
    fs.unlinkSync(testFile);
    console.log('[PROFILE] Directory write permission test passed');
  } catch (err) {
    console.error('[PROFILE] Permission test failed:', err);
  }
  
  // Configure multer with disk storage for better reliability
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, profilesDir);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const uniqueFilename = `${uuidv4()}${ext}`;
      cb(null, uniqueFilename);
    }
  });
  
  const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      // Only accept images
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(null, false);
        return cb(new Error('Only image files are allowed'));
      }
    }
  });
  
  // Enable CORS specifically for image endpoints
  app.use('/api/profile-image/:userId', cors());
  
  // Profile image upload endpoint (parent only)
  app.post('/api/profile-image/:userId', AuthMiddleware, (req: Request, res: Response) => {
    console.log('[PROFILE] Upload request received');
    
    // Check user permissions (only parents can upload)
    if (req.user?.role !== 'parent') {
      console.log('[PROFILE] Permission denied - user is not a parent');
      return res.status(403).json({
        success: false,
        message: 'Only parents can upload profile images'
      });
    }
    
    // Validate user ID
    const { userId } = req.params;
    if (!userId || isNaN(parseInt(userId))) {
      console.log('[PROFILE] Invalid user ID:', userId);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    console.log(`[PROFILE] Processing upload for user ID: ${userId}`);
    
    // Single file upload - this is a separate middleware
    upload.single('profile_image')(req, res, async (uploadErr) => {
      if (uploadErr) {
        console.error('[PROFILE] Upload error:', uploadErr);
        return res.status(400).json({
          success: false,
          message: `Upload failed: ${uploadErr.message}`
        });
      }
      
      // Verify file was received
      if (!req.file) {
        console.error('[PROFILE] No file received');
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }
      
      try {
        // Log file details
        console.log('[PROFILE] Uploaded file:', {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: req.file.path,
          size: req.file.size,
          mimetype: req.file.mimetype
        });
        
        // Construct the public URL for the file
        const publicUrl = `/uploads/profiles/${req.file.filename}`;
        console.log(`[PROFILE] Public URL will be: ${publicUrl}`);
        
        try {
          // Update the user in the database
          console.log(`[PROFILE] Updating user ${userId} with new profile image URL: ${publicUrl}`);
          
          // Verify the user exists
          const userExists = await db.select()
            .from(users)
            .where(eq(users.id, parseInt(userId)))
            .limit(1);
          
          if (!userExists || userExists.length === 0) {
            console.error(`[PROFILE] User ${userId} not found in database`);
            return res.status(404).json({
              success: false,
              message: 'User not found'
            });
          }
          
          // Update the user profile image URL
          await db.update(users)
            .set({ profile_image_url: publicUrl })
            .where(eq(users.id, parseInt(userId)));
          
          console.log(`[PROFILE] Database updated for user: ${userId}`);
          
          // Create timestamp for cache-busting
          const timestamp = new Date().getTime();
          
          // Constructing a detailed success response
          return res.status(200).json({
            success: true,
            message: 'Profile image uploaded successfully',
            profile_image_url: publicUrl,
            public_url: `${publicUrl}?t=${timestamp}`,
            user_id: parseInt(userId),
            file_details: {
              name: req.file.filename,
              size: req.file.size,
              type: req.file.mimetype
            },
            timestamp: timestamp
          });
        } catch (dbError) {
          console.error('[PROFILE] Database error:', dbError);
          return res.status(500).json({
            success: false,
            message: 'Database error updating profile'
          });
        }
      } catch (processingError) {
        console.error('[PROFILE] Error processing file:', processingError);
        return res.status(500).json({
          success: false,
          message: 'Server error processing image',
          error: processingError instanceof Error ? processingError.message : 'Unknown error'
        });
      }
    });
  });
  
  // Get user profile image endpoint
  app.get('/api/profile-image/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      console.log(`[PROFILE] Getting profile image for user: ${userId}`);
      
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
      
      // Add cache-busting timestamp
      const timestamp = new Date().getTime();
      const imageUrl = `${user.profile_image_url}?t=${timestamp}`;
      
      return res.json({
        success: true,
        profile_image_url: imageUrl,
        original_url: user.profile_image_url,
        user_id: user.id,
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
  
  console.log('[PROFILE] Profile image routes registered successfully');
}