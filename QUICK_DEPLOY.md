# 🚀 Hướng dẫn Deploy lên Render - Nhanh

## Bước 1: Setup MongoDB Atlas (5 phút)

1. Truy cập: https://www.mongodb.com/cloud/atlas/register
2. Đăng ký tài khoản miễn phí
3. **Create Cluster**:
   - Chọn **M0 FREE**
   - Provider: **AWS**
   - Region: **Singapore (ap-southeast-1)**
   - Cluster Name: `jtik-cluster`
   - Click **Create**

4. **Database Access** (Menu bên trái):
   - Click **Add New Database User**
   - Username: `jtik-admin`
   - Password: [tạo password mạnh, lưu lại!]
   - Database User Privileges: **Atlas admin**
   - Click **Add User**

5. **Network Access**:
   - Click **Add IP Address**
   - Click **"Allow Access from Anywhere"**
   - IP: `0.0.0.0/0`
   - Click **Confirm**

6. **Get Connection String**:
   - Go back to **Database**
   - Click **Connect** trên cluster
   - Chọn **Connect your application**
   - Copy connection string:
   ```
   mongodb+srv://jtik-admin:<password>@jtik-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Thay `<password>` bằng password bước 4
   - Thêm `/jtik` trước dấu `?`:
   ```
   mongodb+srv://jtik-admin:YOUR_PASSWORD@jtik-cluster.xxxxx.mongodb.net/jtik?retryWrites=true&w=majority
   ```

✅ **Lưu connection string này lại!**

## Bước 2: Deploy lên Render (3 phút)

### A. Tạo tài khoản Render
1. Truy cập: https://dashboard.render.com
2. Sign up with GitHub
3. Authorize Render to access repository

### B. Deploy bằng Blueprint (Automatic)

1. Click **"New +"** → **"Blueprint"**
2. Connect Repository: `iambenn-dztn/jtik`
3. Render sẽ detect file `render.yaml`
4. Click **"Apply"**

Render sẽ tự tạo 2 services:
- ✅ `jtik-server` (Web Service)
- ✅ `jtik-client` (Static Site)

### C. Cấu hình Environment Variables

1. Vào service **jtik-server**
2. Sidebar → **Environment**
3. Thêm biến môi trường:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://jtik-admin:YOUR_PASSWORD@jtik-cluster.xxxxx.mongodb.net/jtik?retryWrites=true&w=majority
ADMIN_PASSWORD=tạo-password-mới-cho-admin
CLIENT_URL=https://jtik-client.onrender.com
```

4. Click **"Save Changes"**
5. Render sẽ tự động **redeploy**

## Bước 3: Đợi Deploy (5-10 phút)

### Server Build (jtik-server):
- Pulling Playwright image... (~2 phút)
- Installing dependencies... (~2 phút)
- Building TypeScript... (~1 phút)
- Total: **~5-10 phút**

### Client Build (jtik-client):
- Installing dependencies... (~1 phút)
- Building with Vite... (~30 giây)
- Total: **~2 phút**

### Theo dõi Progress:
```
jtik-server → Logs (tab)
jtik-client → Logs (tab)
```

## Bước 4: Verify Deployment

### 1. Check Server Health
```bash
curl https://jtik-server.onrender.com/api/health
```

Expected:
```json
{
  "status": "OK",
  "timestamp": "2026-01-10T...",
  "env": "production"
}
```

### 2. Check Client
Mở browser: **https://jtik-client.onrender.com**

### 3. Check MongoDB Connection
Xem logs của `jtik-server`, tìm dòng:
```
✅ Connected to MongoDB: jtik
```

## ✅ Hoàn tất!

**URLs của bạn:**
- 🌐 **Client**: https://jtik-client.onrender.com
- 🖥️ **Server**: https://jtik-server.onrender.com
- 📡 **API**: https://jtik-server.onrender.com/api
- 🗄️ **Database**: MongoDB Atlas

## 🐛 Troubleshooting

### Server không connect được MongoDB
**Lỗi:** `MongoNetworkError` hoặc `ECONNREFUSED`

**Fix:**
1. Kiểm tra **Network Access** trên MongoDB Atlas
2. Đảm bảo đã allow IP `0.0.0.0/0`
3. Kiểm tra `MONGODB_URI` có đúng format không
4. Restart service: Settings → Manual Deploy → Deploy latest commit

### Server build bị timeout
**Nguyên nhân:** Playwright image lớn, mạng chậm

**Fix:**
1. Đợi thêm 5 phút
2. Hoặc Manual Deploy lại

### CORS Error trên Client
**Lỗi:** `Access-Control-Allow-Origin`

**Fix:**
1. Kiểm tra `CLIENT_URL` trong server environment = `https://jtik-client.onrender.com`
2. Kiểm tra `VITE_API_URL` trong client environment = `https://jtik-server.onrender.com`
3. Redeploy cả 2 services

### Free tier spins down
**Behavior:** Service ngủ sau 15 phút không hoạt động

**Expected:** Request đầu tiên sẽ chậm (~30-60 giây) để wake up

**Solution:** Dùng UptimeRobot hoặc cron-job.org để ping mỗi 10 phút

## 📊 Monitor Your App

### Render Dashboard
- Metrics: CPU, Memory usage
- Logs: Real-time application logs
- Deploy history: Previous deployments

### MongoDB Atlas Dashboard
- Metrics: Connections, Operations
- Performance: Query performance
- Storage: Database size

## 🎉 Next Steps

Sau khi deploy thành công:

1. ✅ Test toàn bộ features
2. ✅ Add custom domain (optional)
3. ✅ Setup monitoring/alerts
4. ✅ Schedule database backups
5. ✅ Configure auto-deploy on push

## 💡 Tips

- **First deploy** mất lâu nhất (~10 phút)
- **Subsequent deploys** nhanh hơn (~2-3 phút)
- **Free tier** có giới hạn: 512MB RAM, spin down sau 15 phút
- **MongoDB Atlas free** có 512MB storage
- **HTTPS** được enable tự động

## 📞 Need Help?

1. Check logs: Render Dashboard → Service → Logs
2. Read full guide: [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)
3. MongoDB issues: Check Atlas → Network Access
4. Open GitHub issue nếu cần hỗ trợ

---

**Happy Deploying! 🚀**
