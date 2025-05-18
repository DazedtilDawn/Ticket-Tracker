import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { Request } from "express";

// Configure storage for profile images
const profileImageStorage = multer.diskStorage({
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
  storage: profileImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: imageFileFilter
});

// Helper function to get profile image URL from filename
export function getProfileImageUrl(filename: string): string {
  return `/uploads/profiles/${filename}`;
}

// Default avatar URLs for users without profile pictures
export const DEFAULT_AVATARS = {
  parent: "/uploads/profiles/default-parent-avatar.png",
  child: "/uploads/profiles/default-child-avatar.png"
};

// Create default avatars if they don't exist
export function ensureDefaultAvatars(): void {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Use simple colored squares as default avatars if they don't exist
  const defaultParentPath = path.join(uploadDir, "default-parent-avatar.png");
  const defaultChildPath = path.join(uploadDir, "default-child-avatar.png");
  
  // This is a simplified version - in a production app, you'd want actual default avatars
  if (!fs.existsSync(defaultParentPath)) {
    // We could create a default image here, but for simplicity we'll use existing ones
    console.log("Default parent avatar not found. Using standard profiles when needed.");
  }
  
  if (!fs.existsSync(defaultChildPath)) {
    console.log("Default child avatar not found. Using standard profiles when needed.");
  }
}