# Production Dockerfile for Way of Pi Server
FROM oven/bun:latest as builder

WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
COPY apps/wayofpi-ui/package.json ./apps/wayofpi-ui/
RUN bun install

# Copy source
COPY . .

# Build UI
WORKDIR /app/apps/wayofpi-ui
RUN bun run build

# Production image
FROM oven/bun:latest

WORKDIR /app

COPY --from=builder /app/apps/wayofpi-ui/dist ./apps/wayofpi-ui/dist
COPY --from=builder /app/apps/wayofpi-ui/server ./apps/wayofpi-ui/server
COPY --from=builder /app/apps/wayofpi-ui/package.json ./apps/wayofpi-ui/package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3333

ENV NODE_ENV=production
ENV WOP_SERVER_PORT=3333

CMD ["bun", "run", "apps/wayofpi-ui/server/index.ts"]
