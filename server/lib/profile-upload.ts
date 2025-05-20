import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Express, Request, Response } from 'express';
import { db } from '../db';
import { storage } from '../storage';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { AuthMiddleware } from './auth';
import cors from 'cors';

/**
 * DEFINITIVE PROFILE IMAGE HANDLER v5
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
          const msg = err instanceof Error ? err.message : String(err);
          return cb(new Error(`Failed to create profiles directory: ${msg}`), profilesDir);
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
  app.post('/api/profile-image/:userId', AuthMiddleware(storage, 'parent'), (req: Request, res: Response) => {
    const timestamp = new Date().toISOString();
    console.log('[PROFILE] Upload request received:', 
      { userId: req.params.userId, userRole: req.user?.role, timestamp });
    
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
    
    console.log(`[PROFILE] Processing upload for user ID: ${userId} at ${timestamp}`);
    console.log('[PROFILE] Request content type:', req.get('content-type'));
    
    // Process the uploaded file
    const processUploadedFile = async (err: any) => {
      if (err) {
        console.error('[PROFILE] Upload error:', err);
        return res.status(400).json({
          success: false,
          message: `Upload failed: ${err.message}`,
          code: 'UPLOAD_ERROR',
          timestamp: Date.now()
        });
      }
      
      if (!req.file) {
        console.error('[PROFILE] No file received in request');
        return res.status(400).json({
          success: false,
          message: 'No file was uploaded',
          code: 'NO_FILE',
          timestamp: Date.now()
        });
      }
      
      try {
        // Log file info and request details for debugging
        console.log('[PROFILE-DEBUG] Form fields received:', {
          fields: req.body,
          file: req.file.originalname,
          userId: userId
        });
        
        console.log('[PROFILE] Received file:', {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: req.file.path,
          size: req.file.size,
          mimetype: req.file.mimetype,
          timestamp
        });
        
        // Verify the file was saved correctly
        if (!fs.existsSync(req.file.path)) {
          throw new Error(`File not found at expected path: ${req.file.path}`);
        }
        
        // Build the URL paths
        const cacheBuster = Date.now();
        const relativeUrl = `/uploads/profiles/${req.file.filename}`;
        const publicUrl = `${relativeUrl}?t=${cacheBuster}`;
        console.log(`[PROFILE] Generated public URL: ${publicUrl}`);
        
        try {
          // Verify user exists
          console.log(`[PROFILE] Verifying user ${userId} exists in database`);
          const userExists = await db.select()
            .from(users)
            .where(eq(users.id, parseInt(userId)))
            .limit(1);
          
          if (!userExists || userExists.length === 0) {
            console.error(`[PROFILE] User ${userId} not found in database`);
            try {
              fs.unlinkSync(req.file.path);
              console.log(`[PROFILE] Deleted file for non-existent user: ${req.file.path}`);
            } catch (err) {
              console.error(`[PROFILE] Failed to delete file: ${req.file.path}`, err);
            }
            
            return res.status(404).json({
              success: false,
              message: 'User not found',
              code: 'USER_NOT_FOUND',
              timestamp: cacheBuster
            });
          }
          
          // Update user profile with new image URL
          console.log(`[PROFILE] Updating user ${userId} with new profile image URL: ${relativeUrl}`);
          await db.update(users)
            .set({ profile_image_url: relativeUrl })
            .where(eq(users.id, parseInt(userId)));
          
          // Verify database was updated
          const updatedUser = await db.select()
            .from(users)
            .where(eq(users.id, parseInt(userId)))
            .limit(1);
            
          if (!updatedUser[0].profile_image_url) {
            console.error(`[PROFILE] Database verification failed - URL missing after update`);
            try {
              fs.unlinkSync(req.file.path);
              console.log(`[PROFILE] Deleted orphaned file: ${req.file.path}`);
            } catch (err) {
              console.error(`[PROFILE] Failed to delete file: ${req.file.path}`, err);
            }
            
            return res.status(500).json({
              success: false,
              message: 'Database update failed verification',
              code: 'DB_VERIFY_FAILED',
              timestamp: cacheBuster
            });
          }
          
          console.log(`[PROFILE] Database update successful and verified for user: ${userId}`);
          
          // Send success response
          return res.status(200).json({
            success: true,
            message: 'Profile image uploaded successfully',
            profile_image_url: relativeUrl,
            public_url: publicUrl,
            user_id: parseInt(userId),
            file_details: {
              name: req.file.filename,
              size: req.file.size,
              type: req.file.mimetype
            },
            timestamp: cacheBuster
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
        console.error('[PROFILE] File processing error:', processingError);
        return res.status(500).json({
          success: false,
          message: `Error processing file: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`,
          code: 'PROCESSING_ERROR'
        });
      }
    };
    
    // Try with 'image' field name first (frontend uses this)
    upload.single('image')(req, res, (err) => {
      if (err || !req.file) {
        console.log('[PROFILE] No file with field name "image", trying "profile_image"');
        // Reset req.file if it was partially processed
        req.file = undefined;
        // Try alternate field name as fallback
        upload.single('profile_image')(req, res, processUploadedFile);
      } else {
        // Image field worked
        processUploadedFile(null);
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
        // Return default profile image URL based on user role
        const defaultImage = user.role === 'parent' ? 
          '/assets/default-parent-avatar.png' : 
          '/assets/default-child-avatar.png';
        
        return res.status(200).json({
          success: true,
          message: 'Default profile image returned',
          profile_image_url: defaultImage,
          is_default: true
        });
      }
      
      // Add cache busting parameter to the URL
      const cacheBuster = Date.now();
      const publicUrl = `${user.profile_image_url}?t=${cacheBuster}`;
      
      return res.status(200).json({
        success: true,
        message: 'Profile image found',
        profile_image_url: user.profile_image_url,
        public_url: publicUrl,
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
