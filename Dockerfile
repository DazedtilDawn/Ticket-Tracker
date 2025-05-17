###############   Stage 1 – Build   ###############
FROM node:20-bookworm-slim AS builder

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

COPY . .

RUN npm run build

###############   Stage 2 – Runtime   ###############
FROM node:20-bookworm-slim

WORKDIR /app

COPY --from=builder /app .

RUN groupadd -g 1001 nodejs \
    && useradd -u 1001 -g nodejs -m nodejs

ENV NODE_ENV=production

EXPOSE 5000

USER nodejs

CMD ["node", "dist/index.js"]
