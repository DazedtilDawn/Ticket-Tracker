# ---------- build stage ----------
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Install system dependencies for Playwright
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
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# install dependencies
COPY package*.json ./
RUN npm ci
RUN npm install dotenv

ENV PLAYWRIGHT_BROWSERS_PATH=/home/nodejs/.cache/ms-playwright
RUN npx playwright install chromium --with-deps

# copy source and build as root
COPY . .
RUN npm run build

# prepare unprivileged user
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nodejs

# ---------- runtime stage ----------
FROM node:20-bookworm-slim
WORKDIR /app
COPY --from=builder /app .

ENV NODE_ENV=production
EXPOSE 5000

# drop privileges for runtime
USER nodejs
CMD ["node", "dist/index.js"]
