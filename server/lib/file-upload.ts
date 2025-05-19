import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Create upload directories if they don't exist
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
const profileDir = path.join(uploadDir, 'profiles');

// Ensure directories exist with full permissions
[uploadDir, profileDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    try {
      fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
      console.log(`Successfully created directory: ${dir}`);
    } catch (err) {
      console.error(`Failed to create directory ${dir}:`, err);
    }
  }
  
  // Set permissions
  try {
    fs.chmodSync(dir, 0o777);
  } catch (err) {
    console.error(`Failed to set permissions on ${dir}:`, err);
  }
});

// Create a very simple disk storage for reliability
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use the profile directory for profile images
    const dest = file.fieldname === 'profile_image' ? profileDir : uploadDir;
    console.log(`[FILE-UPLOAD] Saving to destination: ${dest}`);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueFilename = `${uuidv4()}${ext}`;
    console.log(`[FILE-UPLOAD] Generated filename: ${uniqueFilename}`);
    cb(null, uniqueFilename);
  }
});

// Export multer instance
export const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Helper to get URL for uploaded files
export function getFileUrl(file: Express.Multer.File): string {
  if (!file || !file.filename) {
    throw new Error('No valid file provided');
  }
  
  const basePath = '/uploads';
  
  if (file.fieldname === 'profile_image') {
    return `${basePath}/profiles/${file.filename}`;
  }
  
  return `${basePath}/${file.filename}`;
}
