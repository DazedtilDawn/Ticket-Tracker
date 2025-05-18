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
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
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
  app.post("/api/profile-image/:userId", AuthMiddleware, profileUpload.single('profile_image'), async (req: Request, res: Response) => {
    try {
      // Ensure user is a parent
      if (req.user?.role !== 'parent') {
        return res.status(403).json({ message: 'Only parents can upload profile images' });
      }
      
      const { userId } = req.params;
      
      // Verify file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }
      
      // Build the URL path to the uploaded file
      const imageUrl = `/uploads/profiles/${req.file.filename}`;
      
      // Update user record in database
      await db.update(users)
        .set({ profile_image_url: imageUrl })
        .where(eq(users.id, parseInt(userId)));
      
      return res.status(200).json({ 
        success: true, 
        profile_image_url: imageUrl,
        message: 'Profile image uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      return res.status(500).json({ message: 'Failed to upload profile image' });
    }
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