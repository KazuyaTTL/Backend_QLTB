# 🏫 Equipment Management Backend
# TẠ TIẾN LỘC - B23DCCC100

Backend API cho Hệ thống Quản lý Mượn Thiết bị Trường học.

## 📋 Tính năng

### 👨‍🎓 Dành cho Sinh viên:
-  Đăng ký, đăng nhập tài khoản
-  Xem danh sách thiết bị có sẵn
-  Gửi yêu cầu mượn thiết bị
-  Xem lịch sử mượn thiết bị của bản thân
-  Nhận thông báo qua email

### 👨‍💼 Dành cho Admin:
-  Quản lý danh sách thiết bị (CRUD)
-  Xem thống kê thiết bị
-  Quản lý yêu cầu mượn (duyệt/từ chối)
-  Ghi nhận mượn/trả thiết bị
-  Quản lý người dùng
-  Gửi thông báo tự động


## 🚀 Cài đặt

### Yêu cầu hệ thống:
- Node.js v16+ 
- MongoDB v4+
- npm hoặc yarn

### Bước 1: Clone và cài đặt dependencies
```bash
cd equipment-management-backend
npm install
```

### Bước 2: Cấu hình môi trường
Tạo file `.env` trong thư mục gốc:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/equipment_management

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=7d

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Admin Configuration
ADMIN_EMAIL=admin@equipment.com
ADMIN_PASSWORD=admin123456

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Bước 3: Cài đặt MongoDB
**Windows:**
```bash
# Download MongoDB Community từ mongodb.com
# Hoặc dùng MongoDB Atlas (cloud)
```

**Ubuntu/Linux:**
```bash
sudo apt update
sudo apt install mongodb
sudo systemctl start mongodb
```

**macOS:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

### Bước 4: Tạo dữ liệu mẫu
```bash
npm run seed
```

### Bước 5: Chạy server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại: http://localhost:5000

## 📡 API Endpoints

### 🔐 Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Đăng ký tài khoản | Public |
| POST | `/api/auth/login` | Đăng nhập | Public |
| GET | `/api/auth/profile` | Lấy profile | Private |
| PUT | `/api/auth/profile` | Cập nhật profile | Private |
| PUT | `/api/auth/change-password` | Đổi mật khẩu | Private |
| POST | `/api/auth/refresh` | Gia hạn token | Private |
| POST | `/api/auth/logout` | Đăng xuất | Private |

### 🛠️ Equipment Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/equipment` | Lấy danh sách thiết bị | Public |
| GET | `/api/equipment/available` | Lấy thiết bị có sẵn | Public |
| GET | `/api/equipment/stats` | Thống kê thiết bị | Admin |
| GET | `/api/equipment/:id` | Lấy thiết bị theo ID | Public |
| POST | `/api/equipment` | Tạo thiết bị mới | Admin |
| PUT | `/api/equipment/:id` | Cập nhật thiết bị | Admin |
| DELETE | `/api/equipment/:id` | Xóa thiết bị | Admin |

### 📝 Request Management (Đang phát triển)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/requests` | Lấy danh sách yêu cầu | Private |
| POST | `/api/requests` | Tạo yêu cầu mượn | Student |
| GET | `/api/requests/:id` | Lấy chi tiết yêu cầu | Private |
| PUT | `/api/requests/:id/approve` | Duyệt yêu cầu | Admin |
| PUT | `/api/requests/:id/reject` | Từ chối yêu cầu | Admin |

## 🧪 Test API

### Health Check
```bash
curl http://localhost:5000/health
```

### Đăng ký Admin
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Admin Test",
    "email": "admin@test.com",
    "password": "123456",
    "role": "admin"
  }'
```

### Đăng ký Sinh viên
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Nguyễn Văn A",
    "email": "student@test.com",
    "password": "123456",
    "studentId": "SV001",
    "phone": "0123456789",
    "faculty": "Công nghệ thông tin",
    "class": "CNTT01"
  }'
```

### Đăng nhập
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "123456"
  }'
```

### Lấy danh sách thiết bị
```bash
curl http://localhost:5000/api/equipment
```

## 🗄️ Database Models

### User Schema
```javascript
{
  studentId: String,      // Mã sinh viên (chỉ student)
  fullName: String,       // Họ tên
  email: String,          // Email (unique)
  password: String,       // Mật khẩu (hashed)
  role: String,           // 'student' | 'admin'
  phone: String,          // Số điện thoại
  faculty: String,        // Khoa (chỉ student)
  class: String,          // Lớp (chỉ student)
  isActive: Boolean,      // Tài khoản hoạt động
  lastLogin: Date,        // Lần đăng nhập cuối
  createdAt: Date,
  updatedAt: Date
}
```

### Equipment Schema
```javascript
{
  name: String,           // Tên thiết bị
  code: String,           // Mã thiết bị (unique)
  category: String,       // Loại thiết bị
  description: String,    // Mô tả
  specifications: String, // Thông số kỹ thuật
  totalQuantity: Number,  // Tổng số lượng
  availableQuantity: Number, // Số lượng có sẵn
  borrowedQuantity: Number,  // Số lượng đang mượn
  condition: String,      // Tình trạng
  location: {
    building: String,     // Tòa nhà
    floor: String,        // Tầng
    room: String          // Phòng
  },
  purchaseDate: Date,     // Ngày mua
  purchasePrice: Number,  // Giá mua
  warrantyExpiry: Date,   // Hết hạn bảo hành
  images: Array,          // Hình ảnh
  isActive: Boolean,      // Thiết bị hoạt động
  createdBy: ObjectId,    // Người tạo
  updatedBy: ObjectId,    // Người cập nhật
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Scripts

```bash
# Chạy development server
npm run dev

# Chạy production server
npm start

# Tạo dữ liệu mẫu
npm run seed

# Chạy tests (chưa có)
npm test
```

## 📁 Cấu trúc thư mục

```
equipment-management-backend/
├── config/
│   └── database.js         # Cấu hình MongoDB
├── controllers/
│   ├── authController.js   # Xử lý authentication
│   └── equipmentController.js # Xử lý thiết bị
├── middleware/
│   ├── auth.js            # Middleware xác thực
│   └── validation.js      # Middleware validation
├── models/
│   ├── User.js            # Model người dùng
│   ├── Equipment.js       # Model thiết bị
│   └── BorrowRequest.js   # Model yêu cầu mượn
├── routes/
│   ├── auth.js            # Routes authentication
│   ├── equipment.js       # Routes thiết bị
│   ├── requests.js        # Routes yêu cầu (coming soon)
│   ├── users.js           # Routes users (coming soon)
│   └── admin.js           # Routes admin (coming soon)
├── utils/
│   ├── jwt.js             # JWT utilities
│   └── seed.js            # Script tạo dữ liệu mẫu
├── .env                   # Biến môi trường
├── server.js              # File server chính
└── package.json           # Dependencies
```

## 🚀 Deployment

### Với PM2
```bash
npm install -g pm2
pm2 start server.js --name "equipment-api"
pm2 save
pm2 startup
```

### Với Docker
```dockerfile
# Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

