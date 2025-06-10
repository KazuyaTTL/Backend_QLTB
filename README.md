 # 🏫 Equipment Management Backend

Backend API cho Hệ thống Quản lý Mượn Thiết bị Trường học - **HOÀN THÀNH**

## ✅ Tính năng Đã Hoàn Thành

### 👨‍🎓 Dành cho Sinh viên:
- ✅ **Authentication hoàn chỉnh** - Đăng ký, đăng nhập, quản lý profile
- ✅ **Xem thiết bị** - Danh sách, tìm kiếm, filter thiết bị có sẵn
- ✅ **Quản lý yêu cầu mượn** - Tạo, xem lịch sử yêu cầu với borrow limits
- ✅ **Hệ thống thông báo** - Nhận thông báo trong app như Facebook
- ✅ **Theo dõi trạng thái** - Pending, approved, borrowed, returned, rejected
- ✅ **Borrow restrictions** - Giới hạn mượn, xử lý vi phạm quá hạn

### 👨‍💼 Dành cho Admin:
- ✅ **Quản lý thiết bị hoàn chỉnh** - CRUD, thống kê, search & filter
- ✅ **Quản lý yêu cầu mượn** - Duyệt, từ chối, cho mượn, nhận trả
- ✅ **Quản lý người dùng** - Xem, cập nhật giới hạn, thêm/bỏ restrictions
- ✅ **Hệ thống thông báo** - Gửi thông báo chung, trigger warnings
- ✅ **Statistics & Analytics** - 6 APIs thống kê chi tiết
- ✅ **Tự động hóa** - Cron jobs cho nhắc nhở hạn trả
- ✅ **Borrow limit management** - Kiểm soát giới hạn mượn intelligent

### 🔧 Tính năng Kỹ thuật:
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Role-based Authorization** - Admin/Student permissions
- ✅ **Data Validation** - Comprehensive input validation
- ✅ **Error Handling** - Structured error responses
- ✅ **Security Features** - Rate limiting, CORS, helmet
- ✅ **Database Relations** - Optimized MongoDB schemas
- ✅ **Notification System** - In-app notifications with full CRUD
- ✅ **Cron Jobs** - Automated daily reminder system

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

# Admin Configuration (Tự động tạo admin mặc định)
ADMIN_EMAIL=admin@quanlythietbi.edu.vn
ADMIN_PASSWORD=Admin123@
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

### Bước 4: Chạy server
```bash
# Development mode với nodemon
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại: **http://localhost:5000**

## 📡 API Endpoints - HOÀN CHỈNH

### 🔐 Authentication (7 APIs)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Đăng ký sinh viên | Public |
| POST | `/api/auth/login` | Đăng nhập | Public |
| GET | `/api/auth/profile` | Lấy profile | Private |
| PUT | `/api/auth/change-password` | Đổi mật khẩu | Private |
| POST | `/api/auth/refresh-token` | Gia hạn token | Private |
| POST | `/api/auth/logout` | Đăng xuất | Private |
| POST | `/api/auth/create-admin` | Tạo admin (Admin only) | Admin |

### 🛠️ Equipment Management (8 APIs)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/equipment` | Lấy danh sách thiết bị + filter | Public |
| GET | `/api/equipment/available` | Lấy thiết bị có sẵn | Public |
| GET | `/api/equipment/stats` | Thống kê thiết bị | Admin |
| GET | `/api/equipment/:id` | Lấy thiết bị theo ID | Public |
| POST | `/api/equipment` | Tạo thiết bị mới | Admin |
| PUT | `/api/equipment/:id` | Cập nhật thiết bị | Admin |
| DELETE | `/api/equipment/:id` | Xóa thiết bị | Admin |

**Search & Filter Params:**
- `keyword` - Tìm theo tên, mã
- `category` - electronics, laboratory, sports, furniture, vehicle
- `condition` - excellent, good, fair, poor
- `available` - true/false
- `sortBy` - name, code, createdAt, availableQuantity
- `sortOrder` - asc/desc

### 📝 Borrow Request Management (8 APIs)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/requests` | Lấy danh sách yêu cầu | Private |
| GET | `/api/requests/stats` | Thống kê requests | Admin |
| POST | `/api/requests` | Tạo yêu cầu mượn (với borrow limits) | Student |
| GET | `/api/requests/pending-overview/:userId` | Tổng quan pending của user | Admin |
| PUT | `/api/requests/:id/approve` | Duyệt yêu cầu (auto cho mượn) | Admin |
| PUT | `/api/requests/:id/reject` | Từ chối yêu cầu | Admin |
| PUT | `/api/requests/:id/borrow` | Cho mượn thiết bị | Admin |
| PUT | `/api/requests/:id/return` | Nhận trả thiết bị (xử lý overdue) | Admin |

### 👥 User Management (5 APIs) 
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/users` | Lấy danh sách users + filter | Admin |
| GET | `/api/users/:id` | Lấy chi tiết user | Admin |
| PUT | `/api/users/:id/borrow-limit` | Cập nhật giới hạn mượn | Admin |
| POST | `/api/users/:id/restrictions` | Thêm restriction | Admin |
| DELETE | `/api/users/:id/restrictions` | Bỏ restrictions | Admin |

### 📊 Statistics & Analytics (6 APIs)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/statistics/most-borrowed` | Thiết bị mượn nhiều nhất | Private |
| GET | `/api/statistics/monthly-overview` | Tổng quan tháng | Private |
| GET | `/api/statistics/current` | Thống kê hiện tại | Private |
| GET | `/api/statistics/compare` | So sánh 2 tháng | Private |
| POST | `/api/statistics/send-warnings` | Gửi cảnh báo thủ công | Admin |

### 📱 Notifications (8 APIs)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/notifications` | Lấy thông báo + filter | Private |
| GET | `/api/notifications/unread-count` | Đếm thông báo chưa đọc | Private |
| PATCH | `/api/notifications/:id/read` | Đánh dấu đã đọc | Private |
| PATCH | `/api/notifications/mark-all-read` | Đánh dấu tất cả đã đọc | Private |
| DELETE | `/api/notifications/:id` | Xóa thông báo | Private |
| POST | `/api/notifications/general` | Tạo thông báo chung | Admin |
| POST | `/api/notifications/trigger-reminders` | Trigger nhắc nhở | Admin |
| GET | `/api/notifications/stats` | Thống kê thông báo | Admin |

**Notification Types:**
- `request_approved` - Yêu cầu được duyệt
- `request_rejected` - Yêu cầu bị từ chối  
- `borrow_success` - Mượn thiết bị thành công
- `return_reminder` - Nhắc nhở sắp hết hạn
- `return_overdue` - Cảnh báo quá hạn
- `return_success` - Trả thiết bị thành công
- `general` - Thông báo chung

## 🧪 Test API với Postman

### Import Collection
1. Mở Postman → Import
2. Chọn file: `postman-collection.json`
3. Set variables:
   - `base_url`: `http://localhost:5000`
   - `admin_token`: (sau khi login)
   - `student_token`: (sau khi login)

### Test Flow Hoàn chỉnh:
1. **Health Check** - Kiểm tra server
2. **Login Admin** - Lấy admin token
3. **Create Equipment** - Thêm thiết bị mẫu
4. **Register Student** - Đăng ký sinh viên
5. **Login Student** - Lấy student token
6. **Create Borrow Request** - Tạo yêu cầu mượn
7. **Approve Request** - Admin duyệt
8. **Test Notifications** - Kiểm tra thông báo
9. **Test Statistics** - Chạy các API thống kê
10. **Return Equipment** - Trả thiết bị

### Credentials Mặc định:
```javascript
// Admin Account (Tự động tạo khi chạy server)
Email: admin@quanlythietbi.edu.vn
Password: Admin123@

// Test Student (Cần đăng ký)
Email: student@test.com
Password: 123456
Student ID: SV001
```

## 🗄️ Database Schemas

### User Model
```javascript
{
  studentId: String,           // Mã sinh viên (student only)
  fullName: String,            // Họ tên
  email: String,               // Email (unique)
  password: String,            // Hashed password
  role: String,                // 'student' | 'admin'
  phone: String,               // Số điện thoại
  faculty: String,             // Khoa
  class: String,               // Lớp
  
  // Borrow Management
  currentBorrowCount: Number,  // Số thiết bị đang mượn
  borrowLimit: Number,         // Giới hạn mượn (default: 3)
  overdueCount: Number,        // Số lần vi phạm quá hạn
  borrowRestrictions: [{       // Các hạn chế mượn
    type: String,              // 'overdue' | 'admin_restriction'
    reason: String,
    startDate: Date,
    endDate: Date
  }],
  borrowHistory: [...]         // Lịch sử mượn
}
```

### Equipment Model
```javascript
{
  name: String,                // Tên thiết bị
  code: String,                // Mã thiết bị (unique)
  category: String,            // Loại thiết bị
  description: String,         // Mô tả
  specifications: String,      // Thông số kỹ thuật
  
  // Quantity Management
  totalQuantity: Number,       // Tổng số lượng
  availableQuantity: Number,   // Số lượng có sẵn
  borrowedQuantity: Number,    // Số lượng đang được mượn
  
  condition: String,           // 'excellent' | 'good' | 'fair' | 'poor'
  location: {                  // Vị trí lưu trữ
    building: String,
    floor: String,
    room: String
  },
  
  // Purchase Info
  purchaseDate: Date,          // Ngày mua
  purchasePrice: Number,       // Giá mua
  supplier: String,            // Nhà cung cấp
  warrantyExpiry: Date,        // Hết hạn bảo hành
  
  // Status
  isActive: Boolean,           // Trạng thái hoạt động
  notes: String                // Ghi chú
}
```

### BorrowRequest Model
```javascript
{
  requestNumber: String,       // Mã yêu cầu (auto-gen: BR250601)
  borrower: ObjectId,          // Người mượn
  
  // Equipment Details
  equipments: [{
    equipment: ObjectId,       // ID thiết bị
    quantity: Number           // Số lượng mượn
  }],
  
  // Dates
  borrowDate: Date,            // Ngày mượn
  expectedReturnDate: Date,    // Ngày trả dự kiến
  actualReturnDate: Date,      // Ngày trả thực tế
  
  // Purpose & Notes
  purpose: String,             // Mục đích sử dụng
  notes: String,               // Ghi chú
  
  // Status Management
  status: String,              // 'pending' | 'approved' | 'borrowed' | 'returned' | 'rejected'
  
  // Review Info
  reviewedBy: ObjectId,        // Admin duyệt
  reviewedAt: Date,            // Thời gian duyệt
  reviewNotes: String,         // Ghi chú khi duyệt
  rejectionReason: String,     // Lý do từ chối
  
  // Borrow/Return Info
  borrowedBy: ObjectId,        // Admin cho mượn
  borrowedAt: Date,            // Thời gian cho mượn
  returnedBy: ObjectId,        // Admin nhận trả
  returnedAt: Date             // Thời gian nhận trả
}
```

### Notification Model
```javascript
{
  userId: ObjectId,            // Người nhận
  type: String,                // Loại thông báo
  title: String,               // Tiêu đề
  message: String,             // Nội dung
  priority: String,            // 'low' | 'medium' | 'high'
  isRead: Boolean,             // Đã đọc chưa
  
  // Optional References
  relatedRequest: ObjectId,    // Yêu cầu liên quan
  relatedEquipment: ObjectId,  // Thiết bị liên quan
  
  createdAt: Date
}
```

## 🔄 Automated Features

### Cron Jobs (Chạy tự động)
```javascript
// Hàng ngày lúc 9:00 AM
'0 9 * * *' → Kiểm tra và gửi nhắc nhở hạn trả

// Mỗi giờ
'0 * * * *' → Dọn dẹp tokens hết hạn
```

### Borrow Limit System
- **Default limit:** 3 thiết bị/sinh viên
- **Intelligent checking:** Bao gồm cả pending requests
- **Overdue penalties:** Tự động hạn chế khi trả muộn
- **Admin override:** Admin có thể điều chỉnh giới hạn

### Notification Triggers
- **Auto:** Duyệt/từ chối yêu cầu → Thông báo
- **Auto:** Trả thiết bị → Thông báo
- **Scheduled:** Sắp hết hạn → Nhắc nhở
- **Scheduled:** Quá hạn → Cảnh báo
- **Manual:** Admin trigger warnings

## 🎯 Production Ready

### Security Features
- ✅ JWT Token Authentication
- ✅ Password Hashing (bcrypt)
- ✅ Rate Limiting
- ✅ CORS Configuration
- ✅ Input Validation & Sanitization
- ✅ Error Handling & Logging
- ✅ Request Size Limiting

### Performance Optimizations
- ✅ Database Indexing
- ✅ Pagination for List APIs
- ✅ Efficient MongoDB Queries
- ✅ Response Compression
- ✅ Caching Headers

### Monitoring & Logging
- ✅ Request/Response Logging
- ✅ Error Tracking
- ✅ Performance Monitoring
- ✅ Health Check Endpoint

## 📞 Support

**Developed with ❤️ for Equipment Management System**