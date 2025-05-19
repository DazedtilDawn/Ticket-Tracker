import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Setup for file uploads - using memory storage for reliability
console.log('Using local file storage for uploads');

// Set up upload directories
export function setupUploadDirectories() {
  // Define the upload paths
  const baseDir = path.join(process.cwd(), 'public', 'uploads');
  const profilesDir = path.join(baseDir, 'profiles');
  
  // Create both directories with full permissions
  [baseDir, profilesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
    }
    
    // Ensure directory has proper permissions
    try {
      fs.chmodSync(dir, 0o777);
    } catch (err) {
      console.error(`Error setting permissions for ${dir}:`, err);
    }
  });
  
  return { baseDir, profilesDir };
}

// Run directory setup immediately
const { baseDir, profilesDir } = setupUploadDirectories();

// Use memory storage for reliability
const memStorage = multer.memoryStorage();

// Create the multer instance with memory storage
export const upload = multer({
  storage: memStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Function to save an uploaded file from memory to disk
export function saveUploadedFile(file: Express.Multer.File): string {
  if (!file || !file.buffer) {
    throw new Error('No file data provided');
  }
  
  // Determine the target directory
  const targetDir = file.fieldname === 'profile_image' ? profilesDir : baseDir;
  
  // Generate a unique filename
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const filename = `${uuidv4()}${ext}`;
  const fullPath = path.join(targetDir, filename);
  
  console.log(`[UPLOAD] Attempting to save file to: ${fullPath}`);
  console.log(`[UPLOAD] Directory exists: ${fs.existsSync(targetDir)}`);
  
  // Extra check - ensure directory exists
  if (!fs.existsSync(targetDir)) {
    console.log(`[UPLOAD] Creating directory: ${targetDir}`);
    fs.mkdirSync(targetDir, { recursive: true, mode: 0o777 });
  }
  
  // Save the file with additional error checking
  try {
    // First test if directory is writable
    const testFile = path.join(targetDir, '.test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log(`[UPLOAD] Directory is writable`);
    
    // Write the actual file
    fs.writeFileSync(fullPath, file.buffer);
    
    // Verify file was saved successfully
    if (fs.existsSync(fullPath)) {
      console.log(`[UPLOAD] File verified at: ${fullPath}`);
      
      // Return public URL path
      if (file.fieldname === 'profile_image') {
        return `/uploads/profiles/${filename}`;
      }
      return `/uploads/${filename}`;
    } else {
      throw new Error('File was written but could not be verified');
    }
  } catch (error) {
    console.error('[UPLOAD] Error saving file:', error);
    throw new Error(`Failed to save file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper function to get URL from an uploaded file object
export const getFileUrl = (req: any): string => {
  if (req.file) {
    // If using memory storage, the file hasn't been saved to disk yet
    // Use the saveUploadedFile function to save it
    if (req.file.buffer) {
      return saveUploadedFile(req.file);
    }
    
    // If using disk storage, construct the path
    if (req.file.filename) {
      const basePath = '/uploads';
      
      if (req.file.fieldname === 'profile_image') {
        return `${basePath}/profiles/${req.file.filename}`;
      }
      
      return `${basePath}/${req.file.filename}`;
    }
  }
  
  throw new Error('No file was uploaded or file information is missing');
};
