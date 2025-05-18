import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Using local storage for file uploads
const useS3 = false;
console.log('Using local file storage for uploads');

// Configure multer storage with disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine the appropriate subdirectory based on the file type or use case
    let uploadDir;
    if (file.fieldname === 'profile_image') {
      uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
    } else {
      uploadDir = path.join(process.cwd(), 'public', 'uploads');
    }
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

// Create and export the multer instance
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// Helper function to get URL from the uploaded file
export const getFileUrl = (req: any): string => {
  if (req.file?.filename) {
    // Using local storage - construct path based on the field name
    const basePath = '/uploads';
    
    if (req.file.fieldname === 'profile_image') {
      return `${basePath}/profiles/${req.file.filename}`;
    }
    
    return `${basePath}/${req.file.filename}`;
  }
  
  throw new Error('No file was uploaded or file information is missing');
}; 