import fs from 'fs';
import path from 'path';

// Create directories if they don't exist
const choreDir = path.join(process.cwd(), 'public', 'uploads', 'chores');
if (!fs.existsSync(choreDir)) {
  fs.mkdirSync(choreDir, { recursive: true });
}

// Child-friendly chore images with bright, appealing colors and fun designs
function createChoreImageSVG(title, emoji, primaryColor, secondaryColor) {
  return `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:1" />
      </linearGradient>
      <filter id="shadow">
        <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
      </filter>
    </defs>
    
    <!-- Background with gradient -->
    <rect width="300" height="200" fill="url(#bg)" rx="15"/>
    
    <!-- Decorative border -->
    <rect x="5" y="5" width="290" height="190" fill="none" stroke="white" stroke-width="2" rx="10" opacity="0.5"/>
    
    <!-- Large emoji in center -->
    <text x="150" y="90" font-family="Arial, sans-serif" font-size="48" text-anchor="middle" filter="url(#shadow)">${emoji}</text>
    
    <!-- Title text -->
    <text x="150" y="140" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle" filter="url(#shadow)">${title}</text>
    
    <!-- Fun decorative stars -->
    <polygon points="30,30 32,36 38,36 33,40 35,46 30,42 25,46 27,40 22,36 28,36" fill="white" opacity="0.6"/>
    <polygon points="270,30 272,36 278,36 273,40 275,46 270,42 265,46 267,40 262,36 268,36" fill="white" opacity="0.6"/>
    <polygon points="50,170 52,176 58,176 53,180 55,186 50,182 45,186 47,180 42,176 48,176" fill="white" opacity="0.4"/>
    <polygon points="250,170 252,176 258,176 253,180 255,186 250,182 245,186 247,180 242,176 248,176" fill="white" opacity="0.4"/>
  </svg>`;
}

// Define all the child-friendly chore images
const choreImages = [
  // Existing ones (will overwrite with better versions)
  { name: 'brush-teeth.svg', title: 'Brush Teeth', emoji: '🦷', primary: '#10B981', secondary: '#34D399' },
  { name: 'clean-room.svg', title: 'Clean Room', emoji: '🧹', primary: '#8B5CF6', secondary: '#A78BFA' },
  { name: 'take-out-trash.svg', title: 'Take Out Trash', emoji: '🗑️', primary: '#EF4444', secondary: '#F87171' },
  
  // Additional common chores
  { name: 'make-bed.svg', title: 'Make Bed', emoji: '🛏️', primary: '#3B82F6', secondary: '#60A5FA' },
  { name: 'feed-pets.svg', title: 'Feed Pets', emoji: '🐕', primary: '#F59E0B', secondary: '#FBBF24' },
  { name: 'water-plants.svg', title: 'Water Plants', emoji: '🌱', primary: '#22D3EE', secondary: '#67E8F9' },
  { name: 'vacuum.svg', title: 'Vacuum', emoji: '🔌', primary: '#06B6D4', secondary: '#22D3EE' },
  { name: 'dishwasher.svg', title: 'Load Dishwasher', emoji: '🍽️', primary: '#0EA5E9', secondary: '#38BDF8' },
  { name: 'fold-laundry.svg', title: 'Fold Laundry', emoji: '👕', primary: '#A855F7', secondary: '#C084FC' },
  { name: 'set-table.svg', title: 'Set Table', emoji: '🍴', primary: '#EC4899', secondary: '#F472B6' },
  { name: 'clear-table.svg', title: 'Clear Table', emoji: '🧽', primary: '#14B8A6', secondary: '#2DD4BF' },
  { name: 'homework.svg', title: 'Homework', emoji: '📚', primary: '#6366F1', secondary: '#818CF8' },
  { name: 'read-book.svg', title: 'Read Book', emoji: '📖', primary: '#84CC16', secondary: '#A3E635' },
  { name: 'practice-piano.svg', title: 'Practice Piano', emoji: '🎹', primary: '#F97316', secondary: '#FB923C' },
  { name: 'pack-bag.svg', title: 'Pack School Bag', emoji: '🎒', primary: '#D946EF', secondary: '#E879F9' },
  
  // General household chores
  { name: 'wash-dishes.svg', title: 'Wash Dishes', emoji: '🧼', primary: '#0891B2', secondary: '#0FB7D3' },
  { name: 'wipe-counter.svg', title: 'Wipe Counter', emoji: '✨', primary: '#7C3AED', secondary: '#8B5CF6' },
  { name: 'organize-toys.svg', title: 'Organize Toys', emoji: '🧸', primary: '#DC2626', secondary: '#EF4444' },
  { name: 'feed-fish.svg', title: 'Feed Fish', emoji: '🐠', primary: '#059669', secondary: '#10B981' },
  { name: 'walk-dog.svg', title: 'Walk Dog', emoji: '🚶', primary: '#B45309', secondary: '#D97706' },
];

console.log('🎨 Creating child-friendly chore images...\n');

// Create all the images
choreImages.forEach(image => {
  const svg = createChoreImageSVG(image.title, image.emoji, image.primary, image.secondary);
  const filePath = path.join(choreDir, image.name);
  fs.writeFileSync(filePath, svg);
  console.log(`✅ Created ${image.name} - ${image.title}`);
});

console.log(`\n🌟 Successfully created ${choreImages.length} child-friendly chore images!`);
console.log('📁 Images saved to: public/uploads/chores/');