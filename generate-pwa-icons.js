// Script to generate PWA icons from SVG
import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";

// Get the directory name properly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the icon sizes we need for our PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = path.join(__dirname, "public", "icons", "icon-512x512.svg");
const outputDir = path.join(__dirname, "public", "icons");

// Make sure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Simple function to convert SVG to PNG for each size
async function generateIcons() {
  try {
    for (const size of sizes) {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext("2d");

      // Draw a gradient background (as fallback if SVG doesn't load)
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, "#6366f1");
      gradient.addColorStop(1, "#4f46e5");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      // Create a simple ticket icon in case SVG loading fails
      ctx.fillStyle = "white";
      const padding = size * 0.2;
      ctx.fillRect(padding, size * 0.3, size - padding * 2, size * 0.4);

      ctx.strokeStyle = "#ddd";
      ctx.lineWidth = Math.max(1, size * 0.01);
      ctx.setLineDash([size * 0.05, size * 0.03]);
      ctx.beginPath();
      ctx.moveTo(padding, size * 0.4);
      ctx.lineTo(size - padding, size * 0.4);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padding, size * 0.6);
      ctx.lineTo(size - padding, size * 0.6);
      ctx.stroke();

      // Star in the center
      ctx.fillStyle = "#ffca28";
      ctx.setLineDash([]);
      drawStar(ctx, size / 2, size / 2, 5, size * 0.15, size * 0.07);

      // Save the PNG
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(
        path.join(outputDir, `icon-${size}x${size}.png`),
        buffer,
      );
      console.log(`Created icon-${size}x${size}.png`);
    }

    console.log("All PWA icons have been generated!");
  } catch (error) {
    console.error("Error generating icons:", error);
  }
}

// Helper function to draw a star shape
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  let step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);

  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }

  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

// Run the generator
generateIcons();
