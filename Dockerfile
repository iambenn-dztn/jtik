FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

# Copy server package files
COPY server/package*.json ./server/
WORKDIR /app/server

# Install dependencies
RUN npm ci --production=false

# Copy server source code
COPY server ./

# Build TypeScript
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

EXPOSE 10000

# Start the server
CMD ["npm", "start"]
