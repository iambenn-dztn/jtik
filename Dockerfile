FROM node:18

WORKDIR /app

# Copy package files
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install server dependencies
WORKDIR /app/server
RUN npm install

# Install Playwright with all dependencies
RUN npx playwright install --with-deps chromium

# Install client dependencies
WORKDIR /app/client
RUN npm install

# Copy source code
WORKDIR /app
COPY . .

# Build client
WORKDIR /app/client
RUN npm run build

# Build server
WORKDIR /app/server
RUN npm run build

WORKDIR /app/server

EXPOSE 10000

CMD ["npm", "start"]
