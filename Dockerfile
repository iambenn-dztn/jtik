FROM node:18-slim AS builder

WORKDIR /app/server

# Copy package files and install all deps (including typescript for build)
COPY server/package*.json ./
RUN npm install

# Copy server source and build
COPY server/ ./
RUN npm run build

# --- Production stage ---
FROM node:18-slim

WORKDIR /app/server

# Copy package files and install production deps only
COPY server/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy built output from builder
COPY --from=builder /app/server/dist ./dist

EXPOSE 10000

# Run node directly (not via npm) so SIGTERM is handled correctly
CMD ["node", "--max-old-space-size=256", "dist/app.js"]
