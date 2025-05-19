# ---------- build stage ----------
FROM node:20-bookworm-slim AS builder
WORKDIR /app


# install dependencies
COPY package*.json ./
RUN npm ci
RUN npm install dotenv


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
ENV PORT=5000
EXPOSE 5000

# drop privileges for runtime
USER nodejs
CMD ["node", "dist/index.js"]
