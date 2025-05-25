/**
 * Test script for profile image upload
 * This will help isolate issues with the profile upload functionality
 */
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

// Get current directory in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure paths
const rootDir = path.join(__dirname, "..");
const uploadDir = path.join(rootDir, "public", "uploads");
const profilesDir = path.join(uploadDir, "profiles");

console.log("Root directory:", rootDir);
console.log("Upload directory:", uploadDir);
console.log("Profiles directory:", profilesDir);

// Ensure directories exist with proper permissions
[uploadDir, profilesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
  } else {
    console.log(`Using existing directory: ${dir}`);
    fs.chmodSync(dir, 0o777);
  }
});

// Create a simple test image
const testImagePath = path.join(profilesDir, "test-image.jpg");
if (!fs.existsSync(testImagePath)) {
  console.log("Creating test image file...");

  // Create a minimal valid JPEG
  const minimalJpeg = Buffer.from([
    0xff,
    0xd8, // Start of Image (SOI)
    0xff,
    0xe0, // APP0 marker
    0x00,
    0x10, // Length: 16 bytes
    0x4a,
    0x46,
    0x49,
    0x46,
    0x00, // 'JFIF\0'
    0x01,
    0x01, // Version: 1.1
    0x00, // Units: none
    0x00,
    0x01, // Density X: 1
    0x00,
    0x01, // Density Y: 1
    0x00,
    0x00, // Thumbnail width/height: 0/0
    0xff,
    0xdb, // Define Quantization Table (DQT)
    0x00,
    0x84, // Length: 132 bytes
    0x00, // Table ID and precision
    ...Array(64).fill(0x10), // Simple quantization table
    0x01, // Table ID and precision for chrominance
    ...Array(64).fill(0x10), // Simple quantization table for chrominance
    0xff,
    0xc0, // Start of Frame (SOF0)
    0x00,
    0x11, // Length: 17 bytes
    0x08, // 8 bits per component
    0x00,
    0x10, // Height: 16 pixels
    0x00,
    0x10, // Width: 16 pixels
    0x03, // 3 color components
    0x01,
    0x11,
    0x00, // Component 1: ID=1, h=1, v=1, q=0
    0x02,
    0x11,
    0x01, // Component 2: ID=2, h=1, v=1, q=1
    0x03,
    0x11,
    0x01, // Component 3: ID=3, h=1, v=1, q=1
    0xff,
    0xc4, // Define Huffman Table (DHT)
    0x00,
    0x1f, // Length: 31 bytes
    0x00, // Table ID: 0, type: DC, class: 0
    ...Array(16).fill(0x01), // Number of codes of each length
    0x00,
    0x01,
    0x02,
    0x03,
    0x04,
    0x05,
    0x06,
    0x07,
    0x08,
    0x09,
    0x0a,
    0x0b, // Symbols
    0xff,
    0xc4, // Define Huffman Table (DHT)
    0x00,
    0x1f, // Length: 31 bytes
    0x10, // Table ID: 0, type: AC, class: 0
    ...Array(16).fill(0x01), // Number of codes of each length
    0x00,
    0x01,
    0x02,
    0x03,
    0x04,
    0x05,
    0x06,
    0x07,
    0x08,
    0x09,
    0x0a,
    0x0b, // Symbols
    0xff,
    0xda, // Start of Scan (SOS)
    0x00,
    0x0c, // Length: 12 bytes
    0x03, // 3 color components
    0x01,
    0x00, // Component 1: ID=1, table=0
    0x02,
    0x11, // Component 2: ID=2, table=1
    0x03,
    0x11, // Component 3: ID=3, table=1
    0x00,
    0x3f,
    0x00, // Start of spectral, end of spectral, approximation bit
    0x3f,
    0xbf,
    0xcf, // Minimal image data (3 bytes)
    0xff,
    0xd9, // End of Image (EOI)
  ]);

  fs.writeFileSync(testImagePath, minimalJpeg);
  console.log(`Created test image at: ${testImagePath}`);

  // Set file permissions
  fs.chmodSync(testImagePath, 0o666);
  console.log("Set file permissions to 0o666");
}

// Now create a new test profile image with a unique filename
const testFileName = `${uuidv4()}.jpg`;
const newImagePath = path.join(profilesDir, testFileName);

// Copy the test image to our new unique filename
fs.copyFileSync(testImagePath, newImagePath);
console.log(`Created new test profile image at: ${newImagePath}`);
fs.chmodSync(newImagePath, 0o666);

// Public URL that would be stored in database
const publicUrl = `/uploads/profiles/${testFileName}`;
console.log("Generated public URL for database:", publicUrl);

// Run a permissions check on the directory
try {
  const testWrite = path.join(profilesDir, "test-write.txt");
  fs.writeFileSync(testWrite, "Test write");
  fs.unlinkSync(testWrite);
  console.log(
    "Directory permissions check: PASSED - File written and removed successfully",
  );
} catch (error) {
  console.error("Directory permissions check: FAILED");
  console.error(error);
}

// Check that the image is accessible via its public URL
console.log(
  `To verify image accessibility, browse to: https://{domain}${publicUrl}`,
);

console.log("Test completed successfully");
