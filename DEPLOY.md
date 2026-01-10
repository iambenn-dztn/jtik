# 🚀 Deploy Guide

## Quick Deploy to Render.com (Free)

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for production"
git push origin main
```

### 2. Deploy on Render

1. Go to https://render.com
2. Click "New +" → "Blueprint"
3. Connect your GitHub repo
4. Render will auto-detect `render.yaml`
5. Click "Apply"

### 3. Set Environment Variables

**Server (jtik-server):**

- `ADMIN_PASSWORD`: Your admin password
- `CLIENT_URL`: `https://jtik-client.onrender.com`

**Client (jtik-client):**

- `VITE_API_URL`: `https://jtik-server.onrender.com`

### 4. URLs

- **Frontend**: https://jtik-client.onrender.com
- **Backend**: https://jtik-server.onrender.com
- **API**: https://jtik-server.onrender.com/api

## Local Development

**Server:**

```bash
cd server
bash start.sh
# http://localhost:3001
```

**Client:**

```bash
cd client
bash start.sh
# http://localhost:5173
```

## Files Changed

- ✅ `render.yaml` - Deploy configuration
- ✅ `server/app.ts` - Added health check & CORS
- ✅ `client/src/config/api.ts` - Centralized API URLs
- ✅ `client/.env` - Added VITE_API_URL
- ✅ `client/src/services/shoppeService.ts` - Use config
- ✅ `client/src/components/AdminPage.tsx` - Use config

## Status

✅ Ready for production deployment!
