# 🚀 Hướng dẫn chạy dự án với Docker

## ✅ Yêu cầu

- Docker Desktop đã cài đặt và đang chạy
- Git

## 🎯 Quick Start

### 1. Clone project (nếu chưa có)
```bash
git clone https://github.com/iambenn-dztn/jtik.git
cd jtik
```

### 2. Start toàn bộ dự án
```bash
./docker.sh start
```

Lệnh này sẽ start 3 services:
- **MongoDB**: `mongodb://localhost:27017/jtik`
- **Server**: http://localhost:3001
- **Client**: http://localhost:5173

### 3. Mở trình duyệt
```
http://localhost:5173
```

## 📋 Các lệnh quản lý

### Khởi động dự án
```bash
./docker.sh start
```

### Dừng dự án
```bash
./docker.sh stop
```

### Restart dự án
```bash
./docker.sh restart
```

### Xem logs
```bash
# Tất cả services
./docker.sh logs

# Chỉ server
./docker.sh logs server

# Chỉ client
./docker.sh logs client

# Chỉ MongoDB
./docker.sh logs mongodb
```

### Kiểm tra trạng thái
```bash
./docker.sh status
```

### Test API
```bash
./docker.sh test
```

### Truy cập shell
```bash
# MongoDB shell
./docker.sh shell mongodb

# Server shell
./docker.sh shell server

# Client shell
./docker.sh shell client
```

### Rebuild images
```bash
./docker.sh build
```

### Clean up (xóa tất cả data)
```bash
./docker.sh clean
```

## 🔧 Development Workflow

### 1. Start dự án
```bash
./docker.sh start
```

### 2. Code changes tự động reload
- **Client**: Vite hot reload - changes được reflect ngay lập tức
- **Server**: TypeScript tự compile - restart container nếu cần:
  ```bash
  docker restart jtik-server
  ```

### 3. Xem logs để debug
```bash
./docker.sh logs server
# hoặc
./docker.sh logs client
```

### 4. Stop khi không dùng
```bash
./docker.sh stop
```

## 🗄️ MongoDB Data

### Truy cập MongoDB
```bash
./docker.sh shell mongodb
```

Trong MongoDB shell:
```javascript
// Show databases
show dbs

// Use jtik database
use jtik

// Show collections
show collections

// Query customers
db.customers.find()

// Count customers
db.customers.countDocuments()

// Find active customers
db.customers.find({status: "active"})
```

### Backup data
```bash
docker exec jtik-mongodb mongodump --db jtik --out /tmp/backup
docker cp jtik-mongodb:/tmp/backup ./mongodb-backup
```

### Restore data
```bash
docker cp ./mongodb-backup jtik-mongodb:/tmp/backup
docker exec jtik-mongodb mongorestore /tmp/backup
```

## 🌐 Ports

| Service  | Port | URL |
|----------|------|-----|
| MongoDB  | 27017 | mongodb://localhost:27017/jtik |
| Server   | 3001 | http://localhost:3001 |
| Client   | 5173 | http://localhost:5173 |

## 🐛 Troubleshooting

### Services không start
```bash
# Check Docker Desktop đã chạy chưa
docker ps

# Xem logs để biết lỗi
./docker.sh logs

# Restart services
./docker.sh restart
```

### Port đã được sử dụng
```bash
# Dừng services khác đang dùng port 3001, 5173, hoặc 27017
# Hoặc thay đổi port trong docker-compose.yml
```

### MongoDB không connect được
```bash
# Check MongoDB đã healthy chưa
./docker.sh status

# Restart MongoDB
docker restart jtik-mongodb

# Check logs
./docker.sh logs mongodb
```

### Client không load được
```bash
# Check Vite server
./docker.sh logs client

# Rebuild client
docker-compose build client
docker restart jtik-client
```

### Server lỗi
```bash
# Check logs
./docker.sh logs server

# Restart server
docker restart jtik-server

# Rebuild nếu cần
docker-compose build server
docker restart jtik-server
```

## 🔄 Update code từ Git

```bash
# Pull latest code
git pull origin main

# Rebuild và restart
./docker.sh stop
./docker.sh build
./docker.sh start
```

## 🧹 Clean Installation

Nếu gặp vấn đề, clean install:

```bash
# Stop và xóa tất cả
./docker.sh clean

# Xóa images (optional)
docker image rm jtik-client jtik-server

# Start lại
./docker.sh start
```

## 📊 Monitor Resources

### Check Docker resources
```bash
# CPU và Memory usage
docker stats

# Disk usage
docker system df
```

## 🎓 Tips

1. **Hot Reload**: Client tự động reload khi save file
2. **Logs**: Luôn check logs khi có lỗi: `./docker.sh logs`
3. **Clean up**: Chạy `./docker.sh clean` khi muốn reset database
4. **Production**: File docker-compose.yml này chỉ cho development

## ✨ Features

- ✅ Full stack chạy trong Docker
- ✅ Hot reload cho cả client và server
- ✅ MongoDB persistent data (lưu trong volume)
- ✅ Easy management với docker.sh script
- ✅ Isolated environment
- ✅ Consistent across machines

## 🚀 Next Steps

Sau khi dự án chạy local thành công, xem thêm:
- [DEPLOY_MONGODB.md](DEPLOY_MONGODB.md) - Deploy lên production
- [MONGODB_SETUP.md](MONGODB_SETUP.md) - Setup MongoDB Atlas

---

**Need help?** Check logs: `./docker.sh logs`
