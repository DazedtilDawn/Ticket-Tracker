import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Express, Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { AuthMiddleware } from './auth';
import cors from 'cors';

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

// Configure memory storage for better reliability
const memoryStorage = multer.memoryStorage();

// Create the multer upload middleware with memory storage
const upload = multer({
  storage: memoryStorage,
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
  // Enable CORS options for the profile image endpoints
  app.use('/api/profile-image/:userId', cors());
  
  // Profile image upload endpoint - parent only
  app.post('/api/profile-image/:userId', AuthMiddleware, (req: Request, res: Response) => {
    console.log('[PROFILE-UPLOAD] Request received');
    console.log('[PROFILE-UPLOAD] Auth user:', req.user);
    console.log('[PROFILE-UPLOAD] Headers:', req.headers);
    console.log('[PROFILE-UPLOAD] Content-Type:', req.headers['content-type']);
    console.log('[PROFILE-UPLOAD] Content-Length:', req.headers['content-length']);
    
    // Ensure user is a parent
    if (req.user?.role !== 'parent') {
      console.log('[PROFILE-UPLOAD] Authorization failed - not a parent user');
      return res.status(403).json({ message: 'Only parents can upload profile images' });
    }
    
    const { userId } = req.params;
    console.log(`[PROFILE-UPLOAD] Processing for user: ${userId}`);
    
    // Verify upload directories exist with proper permissions
    if (!fs.existsSync(profilesDir)) {
      console.log(`[PROFILE-UPLOAD] Creating missing directory: ${profilesDir}`);
      fs.mkdirSync(profilesDir, { recursive: true, mode: 0o777 });
    } else {
      fs.chmodSync(profilesDir, 0o777);
      console.log(`[PROFILE-UPLOAD] Updated permissions on directory: ${profilesDir}`);
    }
    
    console.log('[PROFILE-UPLOAD] Directory exists:', fs.existsSync(profilesDir));
    console.log('[PROFILE-UPLOAD] Directory is writable:', fs.accessSync(profilesDir, fs.constants.W_OK | fs.constants.R_OK, (err) => !err));
    
    // Process image upload - non-blocking
    const handleUpload = async () => {
      try {
        // Use multer middleware to handle the file upload with a fixed field name
        // Important: The field name must match what's sent from the client (profile_image)
        upload.single('profile_image')(req, res, async (err) => {
          console.log('[PROFILE-UPLOAD] Inside multer middleware handler');
          console.log('[PROFILE-UPLOAD] Got file?', !!req.file);
          if (err) {
            console.error('[PROFILE-UPLOAD] Middleware error:', err);
            return res.status(400).json({
              success: false,
              message: err.message
            });
          }
          
          // Check if file was uploaded
          if (!req.file) {
            console.error('[PROFILE-UPLOAD] No file received in request');
            return res.status(400).json({
              success: false,
              message: 'No file was uploaded'
            });
          }
          
          try {
            console.log('[PROFILE-UPLOAD] File details:', {
              fieldname: req.file.fieldname,
              originalname: req.file.originalname,
              mimetype: req.file.mimetype,
              size: req.file.size,
              filename: req.file.filename,
              path: req.file.path
            });
            
            // With memory storage, we don't need to verify the uploaded file exists
            // as we're about to write it ourselves from the buffer
            
            // Generate a unique filename for the image
            const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
            const filename = `${uuidv4()}${ext}`;
            const filePath = path.join(profilesDir, filename);
            
            // Save the file from buffer to disk
            fs.writeFileSync(filePath, req.file.buffer);
            
            // Get the public URL for the image
            const publicUrl = `/uploads/profiles/${filename}`;
            console.log('[PROFILE-UPLOAD] Public URL:', publicUrl);
            
            try {
              // Update the user's profile image URL in the database
              await db.update(users)
                .set({ profile_image_url: publicUrl })
                .where(eq(users.id, parseInt(userId)));
              
              // Add cache-busting timestamp
              const timestamp = new Date().getTime();
              const cacheBustUrl = `${publicUrl}?t=${timestamp}`;
              
              console.log('[PROFILE-UPLOAD] Updated database and returning success');
              
              // Return success response
              return res.status(200).json({
                success: true,
                message: 'Profile image uploaded successfully',
                profile_image_url: cacheBustUrl
              });
            } catch (dbError) {
              console.error('[PROFILE-UPLOAD] Database error:', dbError);
              return res.status(500).json({
                success: false,
                message: 'Database error updating profile image',
                error: dbError instanceof Error ? dbError.message : 'Unknown error'
              });
            }
          } catch (error) {
            console.error('[PROFILE-UPLOAD] File processing error:', error);
            return res.status(500).json({
              success: false,
              message: 'Server error processing profile image',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        });
      } catch (error) {
        console.error('[PROFILE-UPLOAD] Outer error:', error);
        res.status(500).json({
          success: false,
          message: 'Server error in upload handler',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };
    
    // Execute the upload handling
    handleUpload().catch(error => {
      console.error('[PROFILE-UPLOAD] Unhandled promise rejection:', error);
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