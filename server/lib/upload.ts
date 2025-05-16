import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { config as dotenv } from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv();

// Validate required environment variables
if (!process.env.S3_ENDPOINT || !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY) {
  console.error('S3 configuration environment variables are missing');
  console.error('Required: S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY');
  // Don't throw, gracefully degrade to local storage if missing
}

// Initialize S3 client if environment variables are available
let s3Client;
let useS3 = false;

if (process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY) {
  s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: 'auto', // Railway sets this internally
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
    },
  });
  useS3 = true;
  console.log('S3 storage configured successfully');
} else {
  console.warn('S3 not configured, falling back to local storage');
}

// Configure multer storage
const storage = useS3 
  ? multerS3({
      s3: s3Client,
      bucket: 'uploads', // default bucket Railway creates
      acl: 'public-read',
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueFilename);
      },
    })
  : multer.diskStorage({
      destination: (req, file, cb) => {
        // In case S3 isn't configured, fall back to local storage
        const fs = require('fs');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
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
  if (useS3 && req.file?.location) {
    // When using S3, multer-s3 sets the location property
    return req.file.location;
  } else if (req.file?.filename) {
    // When using local storage, use the path relative to the public directory
    return `/uploads/${req.file.filename}`;
  }
  
  throw new Error('No file was uploaded or file information is missing');
}; 