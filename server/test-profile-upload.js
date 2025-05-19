/**
 * Test script for profile image upload
 * This will simulate a direct upload to help isolate issues
 */
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure paths
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
const profilesDir = path.join(uploadDir, 'profiles');

// Create directories if needed
[uploadDir, profilesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
  } else {
    console.log(`Using existing directory: ${dir}`);
    fs.chmodSync(dir, 0o777);
  }
});

// Create a simple test image if it doesn't exist
const testImagePath = path.join(profilesDir, 'test-image.jpg');
if (!fs.existsSync(testImagePath)) {
  console.log('Creating test image...');
  
  // Create a very small JPEG file with minimal header
  const minimalJpegHeader = Buffer.from([
    0xff, 0xd8, // SOI marker
    0xff, 0xe0, // APP0 marker
    0x00, 0x10, // APP0 length (16 bytes)
    0x4a, 0x46, 0x49, 0x46, 0x00, // 'JFIF\0'
    0x01, 0x01, // version
    0x00, // units
    0x00, 0x01, // X density
    0x00, 0x01, // Y density
    0x00, 0x00, // thumbnail
    0xff, 0xdb, // DQT marker
    0x00, 0x43, // DQT length
    0x00, // table ID and precision
    // Default luminance quantization table (only first few values for brevity)
    0x10, 0x0b, 0x0c, 0x0e, 0x0c, 0x0a, 0x10, 0x0e,
    0x0d, 0x0e, 0x12, 0x11, 0x10, 0x13, 0x18, 0x28,
    0x1a, 0x18, 0x16, 0x16, 0x18, 0x31, 0x23, 0x25,
    0x1d, 0x28, 0x3a, 0x33, 0x3d, 0x3c, 0x39, 0x33,
    0x38, 0x37, 0x40, 0x48, 0x5c, 0x4e, 0x40, 0x44,
    0x57, 0x45, 0x37, 0x38, 0x50, 0x6d, 0x51, 0x57,
    0x5f, 0x62, 0x67, 0x68, 0x67, 0x3e, 0x4d, 0x71,
    0x79, 0x70, 0x64, 0x78, 0x5c, 0x65, 0x67, 0x63,
    // End of image
    0xff, 0xd9
  ]);
  
  fs.writeFileSync(testImagePath, minimalJpegHeader);
  console.log(`Test image created at: ${testImagePath}`);
  
  // Verify permissions
  fs.chmodSync(testImagePath, 0o666);
  console.log('Set file permissions to 0o666');
}

// Create the database entry directly
console.log('Creating a test database entry would go here in a real test');

// Create a test profile image with a new UUID
const testFilename = `${uuidv4()}.jpg`;
const newTestPath = path.join(profilesDir, testFilename);

// Copy the test image
fs.copyFileSync(testImagePath, newTestPath);
console.log(`Created new profile image: ${newTestPath}`);
fs.chmodSync(newTestPath, 0o666);

// Public URL that would be stored in database
const publicUrl = `/uploads/profiles/${testFilename}`;
console.log(`Public URL would be: ${publicUrl}`);

// Log success
console.log('Test completed successfully');
