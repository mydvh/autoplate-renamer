# AutoPlate Renamer - Docker Deployment Guide

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 📋 Tổng quan

AutoPlate Renamer là ứng dụng AI tự động đổi tên file ảnh xe dựa trên biển số xe, được phân tách thành:

- **Backend**: Node.js + Express + TypeORM + PostgreSQL
- **Frontend**: React + Vite + TypeScript
- **Database**: PostgreSQL 16
- **AI**: Google Gemini API

## 🏗️ Kiến trúc

```
autoplate-renamer/
├── backend/              # Node.js API Server
│   ├── src/
│   │   ├── entities/    # TypeORM Entities
│   │   ├── routes/      # API Routes
│   │   ├── middleware/  # Auth Middleware
│   │   ├── config/      # Database Config
│   │   ├── migrations/  # Database Migrations
│   │   └── index.ts     # Entry Point
│   ├── Dockerfile
│   └── package.json
├── frontend/             # React SPA
│   ├── components/
│   ├── services/        # API Services
│   ├── utils/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml
```

## 🚀 Yêu cầu hệ thống

- **Docker Desktop for Windows** (phiên bản mới nhất)
- **Windows 10/11** (WSL2 enabled cho Docker)
- **RAM**: Tối thiểu 4GB khả dụng
- **Disk**: Tối thiểu 5GB trống

## 📦 Cài đặt và Chạy

### Bước 1: Cài đặt Docker Desktop

1. Tải Docker Desktop tại: https://www.docker.com/products/docker-desktop/
2. Cài đặt và khởi động Docker Desktop
3. Đảm bảo WSL2 đã được bật (Docker Desktop sẽ hướng dẫn)

### Bước 2: Clone hoặc Copy dự án

```powershell
# Nếu từ Git
git clone <repository-url>
cd autoplate-renamer

# Hoặc giải nén folder đã có
cd d:\autoplate-renamer
```

### Bước 3: Cấu hình Environment Variables

1. Copy file `.env.example` thành `.env`:

```powershell
Copy-Item .env.example .env
```

2. Mở file `.env` và điền **GEMINI_API_KEY**:

```env
# Database Configuration (có thể giữ nguyên)
DB_TYPE=postgres
DB_USER=autoplate_user
DB_PASSWORD=autoplate_password_2024
DB_NAME=autoplate_renamer
DB_PORT=5432

# JWT Secret (nên đổi trong production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# ⚠️ QUAN TRỌNG: Nhập Gemini API Key của bạn
GEMINI_API_KEY=AIza...your-actual-key-here
```

**Lấy Gemini API Key:**
- Truy cập: https://ai.google.dev/
- Đăng nhập và tạo API Key mới
- Copy và paste vào file `.env`

### Bước 4: Chạy với Docker Compose

```powershell
# Build và start tất cả services
docker-compose up -d --build

# Kiểm tra logs
docker-compose logs -f

# Chỉ xem logs của backend
docker-compose logs -f backend

# Chỉ xem logs của frontend
docker-compose logs -f frontend
```

### Bước 5: Truy cập ứng dụng

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

**Thông tin đăng nhập mặc định:**
- Email: `admin@example.com`
- Password: `123456`

## 🔧 Các lệnh Docker hữu ích

### Quản lý Containers

```powershell
# Dừng tất cả services
docker-compose down

# Dừng và xóa volumes (⚠️ xóa data database)
docker-compose down -v

# Restart một service cụ thể
docker-compose restart backend
docker-compose restart frontend
docker-compose restart postgres

# Xem trạng thái containers
docker-compose ps

# Xem logs realtime
docker-compose logs -f
```

### Quản lý Database

```powershell
# Kết nối vào PostgreSQL container
docker exec -it autoplate-postgres psql -U autoplate_user -d autoplate_renamer

# Backup database
docker exec autoplate-postgres pg_dump -U autoplate_user autoplate_renamer > backup.sql

# Restore database
docker exec -i autoplate-postgres psql -U autoplate_user autoplate_renamer < backup.sql
```

### Rebuild Services

```powershell
# Rebuild chỉ backend
docker-compose up -d --build backend

# Rebuild chỉ frontend
docker-compose up -d --build frontend

# Rebuild tất cả
docker-compose up -d --build
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone_number VARCHAR(50),
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'USER',
  created_at TIMESTAMP
);
```

### Processing Logs Table
```sql
CREATE TABLE processing_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  username VARCHAR(255),
  original_name VARCHAR(255),
  new_name VARCHAR(255),
  timestamp TIMESTAMP
);
```

### System Config Table
```sql
CREATE TABLE system_config (
  key VARCHAR(50) PRIMARY KEY,
  value VARCHAR(255)
);
```

## 🔐 Bảo mật

### Trong Production:

1. **Đổi JWT_SECRET** trong `.env`:
```env
JWT_SECRET=<random-secure-string-at-least-32-chars>
```

2. **Đổi mật khẩu Database**:
```env
DB_PASSWORD=<strong-password-here>
```

3. **Đổi mật khẩu Admin mặc định** sau khi đăng nhập lần đầu

4. **Cấu hình CORS** chặt chẽ hơn trong `backend/src/index.ts`

## 🐛 Troubleshooting

### Lỗi: "Port already in use"

```powershell
# Kiểm tra port nào đang dùng (3000, 5000, 5432)
netstat -ano | findstr :3000
netstat -ano | findstr :5000
netstat -ano | findstr :5432

# Đổi port trong docker-compose.yml
ports:
  - "3001:80"  # Frontend
  - "5001:5000"  # Backend
  - "5433:5432"  # PostgreSQL
```

### Lỗi: "Cannot connect to database"

```powershell
# Kiểm tra PostgreSQL đã chạy chưa
docker-compose ps postgres

# Xem logs PostgreSQL
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Lỗi: "GEMINI_API_KEY not configured"

- Kiểm tra file `.env` đã có `GEMINI_API_KEY`
- Rebuild backend: `docker-compose up -d --build backend`

### Reset toàn bộ

```powershell
# Xóa containers, networks, volumes
docker-compose down -v

# Xóa images
docker-compose down --rmi all -v

# Build lại từ đầu
docker-compose up -d --build
```

## 📊 Monitoring

### Kiểm tra tài nguyên

```powershell
# Xem CPU/Memory usage
docker stats

# Xem disk usage
docker system df
```

### Kiểm tra logs

```powershell
# All services
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs -f backend
```

## 🔄 Cập nhật ứng dụng

```powershell
# Pull latest code (nếu từ Git)
git pull

# Rebuild và restart
docker-compose up -d --build

# Hoặc rebuild từng service
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập

### Users (Admin only)
- `GET /api/users` - Lấy danh sách users
- `POST /api/users` - Tạo user mới
- `PUT /api/users/:id` - Cập nhật user
- `DELETE /api/users/:id` - Xóa user

### Logs
- `GET /api/logs` - Lấy logs (filter: from, to, userId)
- `POST /api/logs` - Tạo log mới

### Config (Admin only)
- `GET /api/config` - Lấy cấu hình hệ thống
- `PUT /api/config` - Cập nhật cấu hình

### Analysis
- `POST /api/analysis/analyze` - Phân tích ảnh xe với Gemini AI

## 🎯 Tính năng chính

- ✅ Tự động phân tích biển số xe bằng AI
- ✅ Đổi tên file theo quy tắc: `[BS]<PlateNumber><Color>`
- ✅ Hỗ trợ màu biển: Trắng (T), Vàng (V), Xanh (X)
- ✅ Phân biệt góc chụp: Front (BS prefix) / Rear (no prefix)
- ✅ Auto-watch folder với scan định kỳ
- ✅ Quản lý user và phân quyền (Admin/User)
- ✅ Logging tất cả thao tác
- ✅ Cấu hình giá mỗi request

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra phần Troubleshooting
2. Xem logs: `docker-compose logs -f`
3. Tạo issue trên GitHub (nếu có)

---

**Phát triển bởi:** AutoPlate Team  
**Version:** 1.0.0  
**Last Updated:** December 2025
