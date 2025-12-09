# Development Guide - Chạy Local không dùng Docker

Nếu bạn muốn phát triển và chạy ứng dụng local trên máy (không qua Docker), làm theo các bước sau:

## Yêu cầu

- Node.js 20+ 
- PostgreSQL 16+
- npm hoặc yarn

## Setup Database

1. Cài đặt PostgreSQL trên Windows
2. Tạo database mới:

```sql
CREATE DATABASE autoplate_renamer;
CREATE USER autoplate_user WITH PASSWORD 'autoplate_password_2024';
GRANT ALL PRIVILEGES ON DATABASE autoplate_renamer TO autoplate_user;
```

## Backend Setup

```powershell
cd backend

# Install dependencies
npm install

# Tạo file .env (copy từ .env.example và sửa)
Copy-Item .env.example .env

# Chỉnh sửa .env:
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=autoplate_user
# DB_PASSWORD=autoplate_password_2024
# DB_NAME=autoplate_renamer
# GEMINI_API_KEY=<your-key>
# JWT_SECRET=dev-secret-key
# PORT=5000
# NODE_ENV=development
# FRONTEND_URL=http://localhost:5173

# Run migrations (TypeORM sẽ tự động tạo tables với synchronize=true)
npm run dev
```

Backend sẽ chạy tại: http://localhost:5000

## Frontend Setup

```powershell
cd frontend

# Install dependencies
npm install

# Tạo file .env
Copy-Item .env.example .env

# Chỉnh sửa .env:
# VITE_API_URL=http://localhost:5000/api

# Start dev server
npm run dev
```

Frontend sẽ chạy tại: http://localhost:5173

## Truy cập

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health: http://localhost:5000/api/health

Đăng nhập với:
- Email: `admin@example.com`
- Password: `123456`

## Hot Reload

- Backend: Tự động reload khi thay đổi code (tsx watch)
- Frontend: Tự động reload khi thay đổi code (vite HMR)

## Build Production

### Backend
```powershell
cd backend
npm run build
npm start
```

### Frontend
```powershell
cd frontend
npm run build
npm run preview
```
