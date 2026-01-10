#!/bin/bash

# Quick Deploy to Render - Setup Script

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}🚀 JTIK - Render Deployment${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

echo -e "${YELLOW}📋 Pre-deployment Checklist:${NC}"
echo ""

# Check 1: MongoDB Atlas
echo -e "${YELLOW}1. MongoDB Atlas Setup${NC}"
echo "   ☐ Created MongoDB Atlas account"
echo "   ☐ Created M0 Free cluster (Singapore region)"
echo "   ☐ Created database user (username + password)"
echo "   ☐ Added IP whitelist: 0.0.0.0/0"
echo "   ☐ Got connection string"
echo ""
read -p "   Have you completed MongoDB Atlas setup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Please complete MongoDB Atlas setup first${NC}"
    echo -e "${BLUE}📖 See: RENDER_DEPLOYMENT.md for instructions${NC}"
    exit 1
fi

echo -e "${GREEN}✅ MongoDB Atlas ready${NC}"
echo ""

# Get MongoDB URI
echo -e "${YELLOW}📝 Enter your MongoDB connection string:${NC}"
echo "   Format: mongodb+srv://username:password@cluster.xxxxx.mongodb.net/jtik?retryWrites=true&w=majority"
read -p "   URI: " MONGODB_URI

if [[ -z "$MONGODB_URI" ]]; then
    echo -e "${RED}❌ MongoDB URI is required${NC}"
    exit 1
fi

# Validate URI format
if [[ ! $MONGODB_URI =~ ^mongodb\+srv:// ]]; then
    echo -e "${RED}❌ Invalid MongoDB URI format${NC}"
    exit 1
fi

echo -e "${GREEN}✅ MongoDB URI validated${NC}"
echo ""

# Get admin password
echo -e "${YELLOW}🔐 Create admin password for your app:${NC}"
read -sp "   Password: " ADMIN_PASSWORD
echo
read -sp "   Confirm password: " ADMIN_PASSWORD_CONFIRM
echo

if [[ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]]; then
    echo -e "${RED}❌ Passwords don't match${NC}"
    exit 1
fi

if [[ -z "$ADMIN_PASSWORD" ]]; then
    echo -e "${RED}❌ Admin password is required${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Admin password set${NC}"
echo ""

# Create .env.render file
echo -e "${YELLOW}📝 Creating environment variables file...${NC}"

cat > .env.render << EOF
# Render Environment Variables
# Copy these to Render dashboard when deploying

# Server Environment Variables (jtik-server)
NODE_ENV=production
PORT=10000
MONGODB_URI=$MONGODB_URI
ADMIN_PASSWORD=$ADMIN_PASSWORD
CLIENT_URL=https://jtik-client.onrender.com

# Client Environment Variables (jtik-client)
VITE_API_URL=https://jtik-server.onrender.com
EOF

echo -e "${GREEN}✅ Environment variables saved to .env.render${NC}"
echo ""

# Summary
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}📋 Next Steps${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo -e "${GREEN}1. Go to Render Dashboard:${NC}"
echo "   https://dashboard.render.com"
echo ""
echo -e "${GREEN}2. Deploy using Blueprint:${NC}"
echo "   • Click 'New' → 'Blueprint'"
echo "   • Connect repository: iambenn-dztn/jtik"
echo "   • Render will detect render.yaml"
echo "   • Click 'Apply'"
echo ""
echo -e "${GREEN}3. Add Environment Variables:${NC}"
echo "   • For jtik-server service:"
echo "   • Copy variables from .env.render file"
echo "   • Paste into Render environment settings"
echo ""
echo -e "${GREEN}4. Wait for deployment:${NC}"
echo "   • Server build: ~5-10 minutes"
echo "   • Client build: ~2-3 minutes"
echo ""
echo -e "${GREEN}5. Test your deployment:${NC}"
echo "   • Server: https://jtik-server.onrender.com/api/health"
echo "   • Client: https://jtik-client.onrender.com"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "   • Environment variables are in .env.render"
echo "   • This file is gitignored for security"
echo "   • Keep this file safe!"
echo ""
echo -e "${GREEN}✅ Setup complete! Ready to deploy.${NC}"
echo ""
echo -e "${BLUE}📖 For detailed instructions, see: RENDER_DEPLOYMENT.md${NC}"
