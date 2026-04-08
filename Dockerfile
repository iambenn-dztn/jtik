FROM node:18-slim

WORKDIR /app

# Copy package files
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install server dependencies (production only)
WORKDIR /app/server
RUN npm install --omit=dev

# Install client dependencies
WORKDIR /app/client
RUN npm install

# Copy source code
WORKDIR /app
COPY . .

# Build client
WORKDIR /app/client
RUN npm run build

# Build server (need typescript for build)
WORKDIR /app/server
RUN npm install typescript && npm run build && npm remove typescript

WORKDIR /app/server

EXPOSE 10000

# Run node directly (not via npm) so SIGTERM is handled correctly
CMD ["node", "--max-old-space-size=256", "dist/app.js"]
