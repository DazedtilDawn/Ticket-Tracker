import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Express, Request, Response } from 'express';
import { db } from '../db';
import { storage as appStorage } from '../storage';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { AuthMiddleware } from './auth';
import cors from 'cors';

/**
 * Banner image upload handler
 * This provides the functionality to upload and manage banner images
 * separate from profile images
 */
export function registerBannerImageRoutes(app: Express) {
  console.log('[BANNER] Setting up banner image handler');
  
  // Define required paths
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  const bannersDir = path.join(uploadDir, 'banners');
  
  console.log('[BANNER] Using directories:', { uploadDir, bannersDir });
  
  // Ensure upload directories exist with proper permissions
  [uploadDir, bannersDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`[BANNER] Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
    } else {
      console.log(`[BANNER] Using existing directory: ${dir}`);
      try {
        fs.chmodSync(dir, 0o777);
      } catch (err) {
        console.error(`[BANNER] Error setting permissions for ${dir}:`, err);
      }
    }
  });
  
  // Run a file system test to verify write permissions before proceeding
  try {
    const testFile = path.join(bannersDir, `permission_test_${Date.now()}.txt`);
    fs.writeFileSync(testFile, 'testing banner upload directory permissions');
    console.log(`[BANNER] Test file created successfully at ${testFile}`);
    fs.unlinkSync(testFile);
    console.log('[BANNER] ✓ Directory write permission test passed');
  } catch (err) {
    console.error('[BANNER] ✘ Permission test failed - uploads may not work:', err);
  }
  
  // Configure multer with disk storage for reliability
  const diskStorage = multer.diskStorage({
    destination: function(req, file, cb) {
      // Double-check directory exists before writing
      if (!fs.existsSync(bannersDir)) {
        try {
          fs.mkdirSync(bannersDir, { recursive: true, mode: 0o777 });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return cb(new Error(`Failed to create banners directory: ${msg}`), bannersDir);
        }
      }
      cb(null, bannersDir);
    },
    filename: function(req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const uniqueFilename = `${uuidv4()}${ext}`;
      cb(null, uniqueFilename);
    }
  });
  
  // Create multer instance for handling uploads
  const upload = multer({
    storage: diskStorage,
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
  
  // Enable CORS for banner image endpoint
  app.use('/api/users/banner-image', cors());
  
  // Banner image upload endpoint
  app.post('/api/users/banner-image', AuthMiddleware(appStorage), (req: Request, res: Response) => {
    const timestamp = new Date().toISOString();
    console.log('[BANNER] Upload request received:', 
      { userId: req.user?.id, userRole: req.user?.role, timestamp });
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // Process the uploaded file
    const processUploadedFile = async (err: any) => {
      if (err) {
        console.error('[BANNER] Upload error:', err);
        return res.status(400).json({
          success: false,
          message: `Upload failed: ${err.message}`,
          code: 'UPLOAD_ERROR',
          timestamp: Date.now()
        });
      }
      
      if (!req.file) {
        console.error('[BANNER] No file received in request');
        return res.status(400).json({
          success: false,
          message: 'No file was uploaded',
          code: 'NO_FILE',
          timestamp: Date.now()
        });
      }
      
      try {
        // Log file info for debugging
        console.log('[BANNER] Received file:', {
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
        const relativeUrl = `/uploads/banners/${req.file.filename}`;
        const publicUrl = `${relativeUrl}?t=${cacheBuster}`;
        console.log(`[BANNER] Generated public URL: ${publicUrl}`);
        
        try {
          const userId = req.user.id;
          
          // Update user profile with new banner image URL
          console.log(`[BANNER] Updating user ${userId} with new banner image URL: ${relativeUrl}`);
          await db.update(users)
            .set({ banner_image_url: relativeUrl })
            .where(eq(users.id, userId));
          
          // Verify database was updated
          const updatedUser = await db.select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
            
          if (!updatedUser[0].banner_image_url) {
            console.error(`[BANNER] Database verification failed - URL missing after update`);
            try {
              fs.unlinkSync(req.file.path);
              console.log(`[BANNER] Deleted orphaned file: ${req.file.path}`);
            } catch (err) {
              console.error(`[BANNER] Failed to delete file: ${req.file.path}`, err);
            }
            
            return res.status(500).json({
              success: false,
              message: 'Database update failed verification',
              code: 'DB_VERIFY_FAILED',
              timestamp: cacheBuster
            });
          }
          
          console.log(`[BANNER] Database update successful and verified for user: ${userId}`);
          
          // Send success response
          return res.status(200).json({
            success: true,
            message: 'Banner image uploaded successfully',
            banner_image_url: relativeUrl,
            public_url: publicUrl,
            user_id: userId,
            file_details: {
              name: req.file.filename,
              size: req.file.size,
              type: req.file.mimetype
            },
            timestamp: cacheBuster
          });
        } catch (dbError) {
          console.error('[BANNER] Database operation error:', dbError);
          return res.status(500).json({
            success: false,
            message: 'Database error updating banner',
            code: 'DB_ERROR'
          });
        }
      } catch (processingError) {
        console.error('[BANNER] File processing error:', processingError);
        return res.status(500).json({
          success: false,
          message: `Error processing file: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`,
          code: 'PROCESSING_ERROR'
        });
      }
    };
    
    // Handle upload with different possible field names
    upload.single('bannerImage')(req, res, (err) => {
      if (err || !req.file) {
        console.log('[BANNER] No file with field name "bannerImage", trying "banner_image"');
        // Reset req.file if it was partially processed
        req.file = undefined;
        // Try alternate field name as fallback
        upload.single('banner_image')(req, res, (err) => {
          if (err || !req.file) {
            console.log('[BANNER] No file with field name "banner_image", trying "image"');
            req.file = undefined;
            upload.single('image')(req, res, processUploadedFile);
          } else {
            processUploadedFile(null);
          }
        });
      } else {
        // First attempt worked
        processUploadedFile(null);
      }
    });
  });
  
  // Banner image retrieval endpoint
  app.get('/api/users/banner-image/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      console.log(`[BANNER] Getting banner image for user: ${userId}`);
      
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
      
      if (!user.banner_image_url) {
        // Fall back to profile image or default
        if (user.profile_image_url) {
          return res.status(200).json({
            success: true,
            message: 'Using profile image as banner fallback',
            banner_image_url: user.profile_image_url,
            is_fallback: true
          });
        }
        
        // Return default banner image URL based on user role
        const defaultImage = user.role === 'parent' ? 
          '/assets/default-parent-banner.png' : 
          '/assets/default-child-banner.png';
        
        return res.status(200).json({
          success: true,
          message: 'Default banner image returned',
          banner_image_url: defaultImage,
          is_default: true
        });
      }
      
      // Add cache busting parameter to the URL
      const cacheBuster = Date.now();
      const publicUrl = `${user.banner_image_url}?t=${cacheBuster}`;
      
      return res.status(200).json({
        success: true,
        message: 'Banner image found',
        banner_image_url: user.banner_image_url,
        public_url: publicUrl,
        user_id: user.id,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('[BANNER] Error retrieving banner image:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve banner image',
        code: 'RETRIEVAL_ERROR'
      });
    }
  });
  
  console.log('[BANNER] Banner image routes registered and ready');
}