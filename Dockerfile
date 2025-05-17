###############   Stage 1 – Build   ###############
FROM node:20-bookworm-slim

# Set working directory
WORKDIR /app

# Install dependencies for Playwright and other utilities
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    libgconf-2-4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    fonts-liberation \
    libnspr4 \
    libnss3 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Install dotenv so production build can load .env
RUN npm install dotenv

# Install Playwright browsers
ENV PLAYWRIGHT_BROWSERS_PATH=/home/nodejs/.cache/ms-playwright
RUN npx playwright install chromium --with-deps

# Create the nodejs user before switching to it
RUN groupadd -g 1001 nodejs \
    && useradd -u 1001 -g nodejs -m nodejs

USER nodejs

# Copy the rest of the application
COPY . .

# Ensure nodejs user owns the source files so build tools can write cache files
RUN chown -R nodejs:nodejs /app

# Build the application
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
