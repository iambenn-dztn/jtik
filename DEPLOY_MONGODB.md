# Hướng dẫn Deploy với MongoDB

## ✅ Đã hoàn thành

### Local Development
1. ✅ MongoDB chạy trong Docker container (port 27017)
2. ✅ Server kết nối MongoDB thành công
3. ✅ API hoạt động bình thường
4. ✅ Data được persist sau khi restart

### Thay đổi chính
- Migrate từ JSON files → MongoDB
- Tất cả routes giờ là async/await
- Connection tự động khi server khởi động
- Graceful shutdown khi server tắt

## 🚀 Deploy lên Production (Render.com)

### Bước 1: Tạo MongoDB Database (Miễn phí)

**Option A: MongoDB Atlas (Khuyến nghị)**
1. Truy cập: https://www.mongodb.com/cloud/atlas/register
2. Tạo tài khoản miễn phí
3. Create New Cluster → M0 Free tier (512MB)
4. Chọn region gần Singapore (ví dụ: AWS Singapore)
5. Database Access → Add New Database User
   - Username: jtik-user
   - Password: [tạo password mạnh]
   - Database User Privileges: Read and write to any database
6. Network Access → Add IP Address
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Confirm
7. Clusters → Connect → Connect your application
   - Driver: Node.js
   - Version: 5.5 or later
   - Copy connection string:
   ```
   mongodb+srv://jtik-user:<password>@cluster0.xxxxx.mongodb.net/jtik?retryWrites=true&w=majority
   ```
   - Thay `<password>` bằng password thực tế

### Bước 2: Cấu hình Render.com

1. Vào Render Dashboard: https://dashboard.render.com
2. Chọn service `jtik-server`
3. Settings → Environment
4. Thêm environment variable mới:
   - Key: `MONGODB_URI`
   - Value: connection string từ MongoDB Atlas
   - Save Changes

### Bước 3: Trigger Deploy

Render sẽ tự động deploy sau khi detect commit mới từ GitHub.

Hoặc manual deploy:
1. Vào service `jtik-server`
2. Manual Deploy → Deploy latest commit

### Bước 4: Verify

1. Kiểm tra logs: `Deploy Logs` tab
2. Phải thấy dòng: `✅ Connected to MongoDB: jtik`
3. Test health check: `https://jtik-server.onrender.com/api/health`
4. Test API: `https://jtik-server.onrender.com/api/shopee/customers`

## 📝 Lưu ý quan trọng

### Connection String Format
```
mongodb+srv://username:password@host/database?options
```

### Common Issues

**Lỗi: "MongoServerError: bad auth"**
- Kiểm tra username/password trong connection string
- Đảm bảo user có quyền read/write

**Lỗi: "MongoNetworkError"**
- Kiểm tra Network Access đã allow 0.0.0.0/0
- Kiểm tra connection string đúng format

**Lỗi: "Connection timeout"**
- MongoDB Atlas cluster có thể đang sleep (free tier)
- Đợi 1-2 phút để cluster wake up

### Free Tier Limitations

**MongoDB Atlas Free (M0):**
- Storage: 512MB
- RAM: Shared
- Connections: 500 concurrent
- Backup: Not included
- ✅ Đủ cho development và small production

**Render Free Tier:**
- RAM: 512MB
- Disk: Ephemeral (không lưu file)
- Sleep sau 15 phút không hoạt động
- ✅ Phù hợp khi dùng MongoDB Atlas

## 🔧 Local Development

### Start MongoDB và Server
```bash
# Start MongoDB
docker-compose up -d mongodb

# Start server
cd server
npm run dev
```

### Stop services
```bash
# Stop server: Ctrl+C

# Stop MongoDB
docker-compose down
```

### Reset database
```bash
# Stop containers
docker-compose down -v

# Remove volumes
docker volume rm jtik_mongodb_data

# Start fresh
docker-compose up -d mongodb
```

## 🎯 Summary

✅ **Local:**
- MongoDB: `mongodb://localhost:27017/jtik`
- Server: http://localhost:3001

✅ **Production:**
- MongoDB: MongoDB Atlas (connection string trong env var)
- Server: https://jtik-server.onrender.com
- Client: https://jtik-client.onrender.com

✅ **Data Persistence:**
- Local: Docker volume `jtik_mongodb_data`
- Production: MongoDB Atlas cloud storage
