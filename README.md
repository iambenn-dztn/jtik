# 🚀 JTIK - Link Management System

Full-stack application for managing Shopee affiliate links and customer data with MongoDB backend.

## 🌟 Features

- 🔗 Transform and manage Shopee affiliate links
- 👥 Customer information management
- 📊 Order tracking system
- 🔐 Admin authentication
- 💾 MongoDB database
- 🐳 Docker support for easy development

## 🛠️ Tech Stack

**Frontend:**
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Axios

**Backend:**
- Node.js 20
- Express 5
- TypeScript
- MongoDB
- Playwright

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Start all services (MongoDB + Server + Client)
./docker.sh start

# Open browser
open http://localhost:5173
```

**Documentation:** [DOCKER_LOCAL.md](DOCKER_LOCAL.md)

### Option 2: Manual Setup

**Prerequisites:**
- Node.js 20+
- MongoDB running

**Server:**
```bash
cd server
npm install
npm run dev
```

**Client:**
```bash
cd client
npm install
npm run dev
```

## 📚 Documentation

- 🐳 **[DOCKER_LOCAL.md](DOCKER_LOCAL.md)** - Local development with Docker
- ☁️ **[RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)** - Deploy to Render.com
- 🗄️ **[MONGODB_SETUP.md](MONGODB_SETUP.md)** - MongoDB Atlas setup
- 📖 **[DEPLOY_MONGODB.md](DEPLOY_MONGODB.md)** - MongoDB migration guide

## 🌐 URLs

### Local Development
- **Client:** http://localhost:5173
- **Server:** http://localhost:3001
- **API:** http://localhost:3001/api
- **MongoDB:** mongodb://localhost:27017/jtik

### Production
- **Client:** https://jtik-client.onrender.com
- **Server:** https://jtik-server.onrender.com
- **API:** https://jtik-server.onrender.com/api

## 🐳 Docker Commands

```bash
# Start all services
./docker.sh start

# Stop all services
./docker.sh stop

# View logs
./docker.sh logs

# View specific service logs
./docker.sh logs server
./docker.sh logs client
./docker.sh logs mongodb

# Check status
./docker.sh status

# Test APIs
./docker.sh test

# Access MongoDB shell
./docker.sh shell mongodb

# Clean up (remove all data)
./docker.sh clean
```

## ☁️ Deploy to Production

### Quick Deploy to Render

1. Setup MongoDB Atlas (free):
```bash
./deploy-render.sh
```

2. Follow instructions in [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)

3. Deploy automatically via Render Blueprint

## 🗂️ Project Structure

```
jtik/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── config/        # API configuration
│   │   └── services/      # API services
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Express backend
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   │   └── mongodb.service.ts
│   ├── app.ts            # Server entry point
│   └── package.json
├── docker-compose.yml     # Docker orchestration
├── Dockerfile            # Production build
├── Dockerfile.dev        # Development build
├── Dockerfile.client     # Client container
├── render.yaml           # Render deployment config
├── docker.sh             # Docker management script
└── deploy-render.sh      # Render deployment helper
```

## 🔐 Environment Variables

### Server
```env
NODE_ENV=development|production
PORT=3001|10000
MONGODB_URI=mongodb://localhost:27017/jtik
ADMIN_PASSWORD=your-secret-password
CLIENT_URL=http://localhost:5173
```

### Client
```env
VITE_API_URL=http://localhost:3001
```

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test customers API
curl http://localhost:3001/api/shopee/customers

# Or use the test script
./docker.sh test
```

## 📊 API Endpoints

### Health Check
```
GET /api/health
```

### Shopee Routes
```
POST /api/shopee/transform-link    # Transform affiliate link
POST /api/shopee/save-info          # Save customer info
GET  /api/shopee/customers          # Get customers
GET  /api/shopee/customers/export   # Export to Excel
PATCH /api/shopee/customers/:id/status
DELETE /api/shopee/customers/:id
```

### Account Management
```
GET  /api/shopee/accounts
POST /api/shopee/accounts
PUT  /api/shopee/accounts/:id
PATCH /api/shopee/accounts/:id/status
DELETE /api/shopee/accounts/:id
```

### Admin
```
POST /api/shopee/admin/auth        # Admin authentication
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is private.

## 🆘 Support

- Check logs: `./docker.sh logs`
- View documentation in `/docs` folder
- Open an issue on GitHub

## 🎯 Roadmap

- [x] MongoDB migration
- [x] Docker support
- [x] Render deployment
- [ ] Unit tests
- [ ] Integration tests
- [ ] CI/CD pipeline
- [ ] Custom domain
- [ ] Advanced monitoring

---

**Made with ❤️ for efficient link management**
