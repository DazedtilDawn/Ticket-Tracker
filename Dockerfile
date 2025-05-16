###############   Stage 1 – Build   ###############
FROM node:20-bookworm-slim AS builder

ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:${PATH}"
RUN corepack enable

WORKDIR /app

# OS deps for Playwright + curl
RUN apt-get update && apt-get install -y \
    curl jq \
    libasound2 libatk1.0-0 libatk-bridge2.0-0 libcairo2 libcups2 libdbus-1-3 \
    libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 \
    libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 \
    libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 \
    libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation \
    lsb-release xdg-utils wget --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml* package-lock.json* ./
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile --prod=false; \
    else npm ci; fi

# Install Playwright browsers
RUN npx playwright install --with-deps chromium

COPY . .
RUN npm run build

###############   Stage 2 – Runtime   ###############
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nodejs

# Runtime libs for Playwright
RUN apt-get update && apt-get install -y \
    curl \
    libasound2 libatk1.0-0 libatk-bridge2.0-0 libcairo2 libcups2 libdbus-1-3 \
    libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 \
    libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 \
    libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 \
    libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation \
    lsb-release xdg-utils wget --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist          ./dist
COPY --from=builder /app/node_modules  ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /root/.cache/ms-playwright /home/nodejs/.cache/ms-playwright
ENV PLAYWRIGHT_BROWSERS_PATH=/home/nodejs/.cache/ms-playwright

USER nodejs
EXPOSE 5000
CMD ["npm", "run", "start"]
