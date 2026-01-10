# ✅ Render Deployment Checklist

## Pre-Deployment

### MongoDB Atlas Setup
- [ ] Create MongoDB Atlas account
- [ ] Create M0 Free cluster (Singapore region)
- [ ] Create database user (username: `jtik-admin`)
- [ ] Add IP whitelist: `0.0.0.0/0`
- [ ] Get connection string
- [ ] Test connection string format

### Render Setup
- [ ] Create Render account
- [ ] Connect GitHub repository
- [ ] Verify repository access

## Deployment

### Blueprint Deploy
- [ ] Click "New +" → "Blueprint"
- [ ] Select repository: `iambenn-dztn/jtik`
- [ ] Confirm `render.yaml` detected
- [ ] Click "Apply"

### Environment Variables (jtik-server)
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000`
- [ ] `MONGODB_URI=[your-mongodb-atlas-uri]`
- [ ] `ADMIN_PASSWORD=[create-strong-password]`
- [ ] `CLIENT_URL=https://jtik-client.onrender.com`
- [ ] Click "Save Changes"

### Environment Variables (jtik-client)
- [ ] `VITE_API_URL=https://jtik-server.onrender.com`
- [ ] Click "Save Changes"

## Verification

### Build Success
- [ ] Server build completed (5-10 min)
- [ ] Client build completed (2-3 min)
- [ ] No build errors in logs

### Health Checks
- [ ] Server health: `curl https://jtik-server.onrender.com/api/health`
- [ ] Client accessible: `https://jtik-client.onrender.com`
- [ ] MongoDB connected (check server logs for "✅ Connected to MongoDB: jtik")

### Functional Tests
- [ ] Can access admin page
- [ ] Can login with admin password
- [ ] Can view customers list
- [ ] Can create customer
- [ ] API responds correctly

## Post-Deployment

### Documentation
- [ ] Update team with production URLs
- [ ] Document admin credentials (securely)
- [ ] Share MongoDB Atlas access

### Monitoring
- [ ] Check Render metrics
- [ ] Monitor MongoDB Atlas metrics
- [ ] Setup uptime monitoring (optional)

### Optional Enhancements
- [ ] Add custom domain
- [ ] Configure auto-deploy on push
- [ ] Setup backup strategy
- [ ] Enable deploy notifications
- [ ] Add error tracking

## URLs

**Production:**
- Client: https://jtik-client.onrender.com
- Server: https://jtik-server.onrender.com
- Health: https://jtik-server.onrender.com/api/health

**Dashboards:**
- Render: https://dashboard.render.com
- MongoDB Atlas: https://cloud.mongodb.com

## Troubleshooting

If deployment fails:
- [ ] Check build logs for errors
- [ ] Verify all environment variables
- [ ] Test MongoDB connection string locally
- [ ] Check Network Access on MongoDB Atlas
- [ ] Try manual deploy
- [ ] Consult RENDER_DEPLOYMENT.md

---

**Status:** 
- [ ] Not started
- [ ] In progress
- [ ] Deployed ✅
- [ ] Verified ✅

**Deployed by:** _____________  
**Date:** _____________  
**URLs verified:** _____________
