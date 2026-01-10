# Render Production Deployment

## Prerequisites

Trước khi deploy lên Render, bạn cần:

### 1. MongoDB Atlas (Database)
Render free tier không hỗ trợ MongoDB container. Bạn cần tạo MongoDB Atlas miễn phí:

1. Truy cập: https://www.mongodb.com/cloud/atlas/register
2. Tạo tài khoản miễn phí
3. Create Cluster → M0 Free (512MB)
4. Chọn region: **AWS / Singapore (ap-southeast-1)** (gần Render Singapore)

#### Database Access
1. Database Access → Add New Database User
   - Authentication: Password
   - Username: `jtik-admin`
   - Password: [tạo password mạnh, lưu lại]
   - Database User Privileges: **Atlas admin**
   - Click **Add User**

#### Network Access
1. Network Access → Add IP Address
2. Click **"Allow Access from Anywhere"**
3. IP Address: `0.0.0.0/0`
4. Click **Confirm**

#### Get Connection String
1. Clusters → Connect → Connect your application
2. Driver: **Node.js**
3. Version: **5.5 or later**
4. Copy connection string:
   ```
   mongodb+srv://jtik-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Thay `<password>` bằng password thực tế
6. Thêm database name vào cuối:
   ```
   mongodb+srv://jtik-admin:<password>@cluster0.xxxxx.mongodb.net/jtik?retryWrites=true&w=majority
   ```

### 2. GitHub Repository
Code đã được push lên: https://github.com/iambenn-dztn/jtik

## Deploy to Render

### Method 1: Automatic (Blueprint - Recommended)

1. Truy cập: https://dashboard.render.com
2. Đăng nhập với GitHub
3. Click **"New"** → **"Blueprint"**
4. Connect Repository: **iambenn-dztn/jtik**
5. Render sẽ tự detect `render.yaml`
6. Click **"Apply"**

Render sẽ tự động tạo 2 services:
- ✅ jtik-server (Web Service)
- ✅ jtik-client (Static Site)

### Method 2: Manual

#### Deploy Server

1. Dashboard → New → Web Service
2. Connect GitHub repository: **iambenn-dztn/jtik**
3. Cấu hình:
   - **Name**: `jtik-server`
   - **Region**: Singapore
   - **Branch**: `main`
   - **Root Directory**: `.` (root)
   - **Runtime**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: Free

4. Environment Variables (quan trọng!):
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://jtik-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/jtik?retryWrites=true&w=majority
   ADMIN_PASSWORD=[tạo password cho admin login]
   CLIENT_URL=https://jtik-client.onrender.com
   ```

5. Health Check Path: `/api/health`

6. Click **"Create Web Service"**

#### Deploy Client

1. Dashboard → New → Static Site
2. Connect GitHub repository: **iambenn-dztn/jtik**
3. Cấu hình:
   - **Name**: `jtik-client`
   - **Branch**: `main`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `./client/dist`

4. Environment Variables:
   ```
   VITE_API_URL=https://jtik-server.onrender.com
   ```

5. Click **"Create Static Site"**

## Post-Deployment

### 1. Verify Server
```bash
curl https://jtik-server.onrender.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-01-10T...",
  "env": "production"
}
```

### 2. Verify Client
Mở trình duyệt: https://jtik-client.onrender.com

### 3. Check MongoDB Connection
Xem logs của server trên Render dashboard:
- Tìm dòng: `✅ Connected to MongoDB: jtik`
- Nếu có lỗi connection, kiểm tra lại MONGODB_URI

## Troubleshooting

### Server không start
**Lỗi**: `MongoNetworkError` hoặc `ECONNREFUSED`

**Giải pháp**:
1. Kiểm tra Network Access trên MongoDB Atlas
2. Đảm bảo đã allow `0.0.0.0/0`
3. Kiểm tra MONGODB_URI trong environment variables

### Server bị timeout khi deploy
**Nguyên nhân**: Render free tier có 512MB RAM, Playwright chiếm nhiều RAM

**Giải pháp**:
1. Build sẽ mất 5-10 phút (bình thường)
2. Nếu timeout, trigger deploy lại

### Client không connect được server
**Lỗi**: CORS error

**Giải pháp**:
1. Kiểm tra `CLIENT_URL` trong server environment variables
2. Kiểm tra `VITE_API_URL` trong client environment variables
3. Đảm bảo cả 2 URLs đúng

### Application logs

**Server logs**:
```bash
# Trên Render dashboard
jtik-server → Logs
```

**Client logs**:
```bash
# Trên Render dashboard
jtik-client → Logs
```

## Environment Variables Reference

### Server (jtik-server)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| NODE_ENV | ✅ | production | Environment mode |
| PORT | ✅ | 10000 | Server port (Render uses 10000) |
| MONGODB_URI | ✅ | mongodb+srv://... | MongoDB Atlas connection string |
| ADMIN_PASSWORD | ✅ | [secret] | Admin authentication password |
| CLIENT_URL | ✅ | https://jtik-client.onrender.com | CORS allowed origin |

### Client (jtik-client)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| VITE_API_URL | ✅ | https://jtik-server.onrender.com | Backend API URL |

## Limitations (Free Tier)

### Render Free Tier
- ✅ 512MB RAM
- ✅ Shared CPU
- ✅ 100GB bandwidth/month
- ⚠️ **Spins down after 15 minutes inactivity**
- ⚠️ First request sau khi sleep sẽ chậm (30-60s)

### MongoDB Atlas Free (M0)
- ✅ 512MB storage
- ✅ Shared RAM
- ✅ No backup
- ✅ Đủ cho development và small production

## Monitoring

### Server Health
```bash
curl https://jtik-server.onrender.com/api/health
```

### Check Customers
```bash
curl https://jtik-server.onrender.com/api/shopee/customers
```

### Database Stats
1. MongoDB Atlas Dashboard
2. Clusters → Metrics
3. Xem:
   - Connections
   - Network
   - Operations

## Updates

Khi có code mới:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Render sẽ tự động:
1. Detect commit mới
2. Trigger build
3. Deploy

## Backup Strategy

### MongoDB Backup
1. MongoDB Atlas Dashboard
2. Clusters → ... → Restore from Snapshot
3. Free tier: Manual export only

### Manual Export
```bash
# Local machine với mongosh
mongosh "mongodb+srv://cluster0.xxxxx.mongodb.net/jtik" --username jtik-admin

# Export
mongoexport --uri="mongodb+srv://..." --collection=customers --out=customers.json
mongoexport --uri="mongodb+srv://..." --collection=accounts --out=accounts.json
```

## Support

- Render Docs: https://render.com/docs
- MongoDB Atlas Docs: https://www.mongodb.com/docs/atlas/
- Project Issues: https://github.com/iambenn-dztn/jtik/issues

## Next Steps

Sau khi deploy thành công:

1. ✅ Test toàn bộ chức năng
2. ✅ Setup monitoring alerts trên Render
3. ✅ Configure custom domain (optional)
4. ✅ Enable HTTPS (automatic on Render)
5. ✅ Schedule regular MongoDB backups

---

**Production URLs:**
- Server: https://jtik-server.onrender.com
- Client: https://jtik-client.onrender.com
- Health: https://jtik-server.onrender.com/api/health
