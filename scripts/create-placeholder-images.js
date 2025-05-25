const fs = require('fs');
const path = require('path');

// Create a simple colored rectangle as placeholder
function createPlaceholderSVG(text, color) {
  return `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="300" fill="${color}"/>
    <text x="200" y="150" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
  </svg>`;
}

const choreImages = [
  { name: 'make-bed.svg', text: 'Make Bed', color: '#3B82F6' },
  { name: 'brush-teeth.svg', text: 'Brush Teeth', color: '#10B981' },
  { name: 'clean-room.svg', text: 'Clean Room', color: '#8B5CF6' },
  { name: 'feed-pets.svg', text: 'Feed Pets', color: '#F59E0B' },
  { name: 'take-out-trash.svg', text: 'Take Out Trash', color: '#EF4444' },
  { name: 'set-table.svg', text: 'Set Table', color: '#EC4899' },
  { name: 'clear-table.svg', text: 'Clear Table', color: '#14B8A6' },
  { name: 'water-plants.svg', text: 'Water Plants', color: '#22D3EE' },
  { name: 'homework.svg', text: 'Homework', color: '#6366F1' },
  { name: 'read-book.svg', text: 'Read Book', color: '#84CC16' },
  { name: 'practice-piano.svg', text: 'Practice Piano', color: '#F97316' },
  { name: 'vacuum.svg', text: 'Vacuum', color: '#06B6D4' },
  { name: 'dishwasher.svg', text: 'Load Dishwasher', color: '#0EA5E9' },
  { name: 'fold-laundry.svg', text: 'Fold Laundry', color: '#A855F7' },
  { name: 'pack-bag.svg', text: 'Pack School Bag', color: '#D946EF' }
];

const profileImages = [
  { name: 'bryce.svg', text: 'Bryce', color: '#2563EB' },
  { name: 'kiki.svg', text: 'Kiki', color: '#EC4899' }
];

// Create chore images
choreImages.forEach(image => {
  const svg = createPlaceholderSVG(image.text, image.color);
  const filePath = path.join(__dirname, '..', 'public', 'uploads', 'chores', image.name);
  fs.writeFileSync(filePath, svg);
  console.log(`✅ Created ${image.name}`);
});

// Create profile images
profileImages.forEach(image => {
  const svg = createPlaceholderSVG(image.text, image.color);
  const filePath = path.join(__dirname, '..', 'public', 'uploads', 'profiles', image.name);
  fs.writeFileSync(filePath, svg);
  console.log(`✅ Created ${image.name}`);
});

console.log('\n🎨 All placeholder images created!');