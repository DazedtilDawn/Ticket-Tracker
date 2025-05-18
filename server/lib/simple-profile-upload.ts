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

/**
 * DEFINITIVE PROFILE IMAGE HANDLER v3
 * This is a self-contained implementation of profile image upload
 * with zero dependencies on other implementations.
 */
export function registerProfileImageRoutes(app: Express) {
  console.log('[PROFILE] Setting up profile image handler (DEFINITIVE IMPLEMENTATION)');
  
  // Define required paths
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  const profilesDir = path.join(uploadDir, 'profiles');
  
  console.log('[PROFILE] Using directories:', { uploadDir, profilesDir });
  
  // Ensure upload directories exist with proper permissions
  [uploadDir, profilesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`[PROFILE] Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
    } else {
      console.log(`[PROFILE] Using existing directory: ${dir}`);
      try {
        fs.chmodSync(dir, 0o777);
      } catch (err) {
        console.error(`[PROFILE] Error setting permissions for ${dir}:`, err);
      }
    }
  });
  
  // Run a file system test to verify write permissions before proceeding
  try {
    const testFile = path.join(profilesDir, `permission_test_${Date.now()}.txt`);
    fs.writeFileSync(testFile, 'testing upload directory permissions');
    console.log(`[PROFILE] Test file created successfully at ${testFile}`);
    fs.unlinkSync(testFile);
    console.log('[PROFILE] ✓ Directory write permission test passed');
  } catch (err) {
    console.error('[PROFILE] ✘ Permission test failed - uploads may not work:', err);
  }
  
  // Configure multer with disk storage for reliability
  const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      // Double-check directory exists before writing
      if (!fs.existsSync(profilesDir)) {
        try {
          fs.mkdirSync(profilesDir, { recursive: true, mode: 0o777 });
        } catch (err) {
          return cb(new Error(`Failed to create profiles directory: ${err.message}`), profilesDir);
        }
      }
      cb(null, profilesDir);
    },
    filename: function(req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const uniqueFilename = `profile_${uuidv4()}${ext}`;
      cb(null, uniqueFilename);
    }
  });
  
  // Create multer instance for handling uploads
  const upload = multer({
    storage: storage,
    limits: { 
      fileSize: 5 * 1024 * 1024, // 5MB limit
      files: 1 // Only one file per request
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        // Don't accept the file
        cb(null, false);
        cb(new Error(`Only image files accepted (got ${file.mimetype})`));
      }
    }
  });
  
  // Enable CORS for profile image endpoints
  app.use('/api/profile-image/:userId', cors());
  
  // Profile image upload endpoint (parent only)
  app.post('/api/profile-image/:userId', AuthMiddleware, (req: Request, res: Response) => {
    console.log('[PROFILE] Upload request received:', 
      { userId: req.params.userId, userRole: req.user?.role, method: req.method });
    
    // Permission check (only parents can upload)
    if (req.user?.role !== 'parent') {
      console.log('[PROFILE] Permission denied - user is not a parent');
      return res.status(403).json({
        success: false,
        message: 'Only parents can upload profile images',
        code: 'PERMISSION_DENIED'
      });
    }
    
    // Validate user ID
    const { userId } = req.params;
    if (!userId || isNaN(parseInt(userId))) {
      console.log('[PROFILE] Invalid user ID:', userId);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
        code: 'INVALID_USER_ID'
      });
    }
    
    console.log(`[PROFILE] Processing upload for user ID: ${userId}`);
    
    // Use multer middleware to handle file upload
    upload.single('profile_image')(req, res, async (uploadErr) => {
      // Handle upload errors from multer
      if (uploadErr) {
        console.error('[PROFILE] Upload error from multer:', uploadErr);
        return res.status(400).json({
          success: false,
          message: `Upload failed: ${uploadErr.message}`,
          code: 'UPLOAD_ERROR'
        });
      }
      
      // Check if we got a file
      if (!req.file) {
        console.error('[PROFILE] No file received in request');
        return res.status(400).json({
          success: false,
          message: 'No file was uploaded',
          code: 'NO_FILE'
        });
      }
      
      try {
        // Log file info
        console.log('[PROFILE] Received file:', {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: req.file.path,
          size: req.file.size,
          mimetype: req.file.mimetype
        });
        
        // Double check the file was actually saved
        if (!fs.existsSync(req.file.path)) {
          throw new Error(`File not found at expected path: ${req.file.path}`);
        }
        
        // Build the public URL for accessing the file
        const publicUrl = `/uploads/profiles/${req.file.filename}`;
        console.log(`[PROFILE] Generated public URL: ${publicUrl}`);
        
        try {
          // First verify the user exists in database
          console.log(`[PROFILE] Verifying user ${userId} exists in database`);
          const userExists = await db.select()
            .from(users)
            .where(eq(users.id, parseInt(userId)))
            .limit(1);
          
          if (!userExists || userExists.length === 0) {
            console.error(`[PROFILE] User ${userId} not found in database`);
            return res.status(404).json({
              success: false,
              message: 'User not found',
              code: 'USER_NOT_FOUND'
            });
          }
          
          // Update the user record with new profile image URL
          console.log(`[PROFILE] Updating user ${userId} with new profile image URL: ${publicUrl}`);
          await db.update(users)
            .set({ profile_image_url: publicUrl })
            .where(eq(users.id, parseInt(userId)));
          
          // Verify database was updated
          const updatedUser = await db.select()
            .from(users)
            .where(eq(users.id, parseInt(userId)))
            .limit(1);
            
          if (updatedUser[0].profile_image_url !== publicUrl) {
            console.error(`[PROFILE] Database verification failed - URL mismatch: 
              Expected ${publicUrl}, got ${updatedUser[0].profile_image_url}`);
            return res.status(500).json({
              success: false,
              message: 'Database update failed verification',
              code: 'DB_VERIFY_FAILED'
            });
          }
          
          console.log(`[PROFILE] Database update successful and verified for user: ${userId}`);
          
          // Add timestamp for cache busting
          const timestamp = new Date().getTime();
          const cachedUrl = `${publicUrl}?t=${timestamp}`;
          
          // Send comprehensive success response
          return res.status(200).json({
            success: true,
            message: 'Profile image uploaded successfully',
            profile_image_url: publicUrl,
            public_url: cachedUrl,
            user_id: parseInt(userId),
            file_details: {
              name: req.file.filename,
              size: req.file.size,
              type: req.file.mimetype
            },
            timestamp: timestamp
          });
        } catch (dbError) {
          console.error('[PROFILE] Database operation error:', dbError);
          return res.status(500).json({
            success: false,
            message: 'Database error updating profile',
            code: 'DB_ERROR'
          });
        }
      } catch (processingError) {
        console.error('[PROFILE] Error processing uploaded file:', processingError);
        return res.status(500).json({
          success: false,
          message: 'Server error processing image',
          error: processingError instanceof Error ? processingError.message : 'Unknown error',
          code: 'PROCESSING_ERROR'
        });
      }
    });
  });
  
  // Profile image retrieval endpoint
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
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      
      const user = userResult[0];
      
      if (!user.profile_image_url) {
        return res.status(404).json({
          success: false,
          message: 'User has no profile image',
          code: 'NO_PROFILE_IMAGE'
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
      console.error('[PROFILE] Error retrieving profile image:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile image',
        code: 'RETRIEVAL_ERROR'
      });
    }
  });
  
  console.log('[PROFILE] Profile image routes registered and ready');
}