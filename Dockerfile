FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

# Copy package files
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN cd server && npm install
RUN cd client && npm install

# Copy source code
COPY server ./server
COPY client ./client

# Build client
RUN cd client && npm run build

# Build server TypeScript
RUN cd server && npm run build

# Expose port
EXPOSE 10000

# Start server
CMD ["node", "server/dist/app.js"]
