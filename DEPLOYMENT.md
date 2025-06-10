# 🚀 Hướng dẫn Deploy Backend Equipment Management

## 📋 Tổng quan

Backend này có thể deploy lên các platform miễn phí sau:
- **Railway** (Khuyên dùng) - $5 credit/tháng
- **Render** - 750h/tháng miễn phí  
- **Fly.io** - $5 credit/tháng
- **Heroku** - Hạn chế hơn

## 🎯 Option 1: Deploy với Railway (Khuyên dùng)

### Bước 1: Chuẩn bị MongoDB Atlas

1. Truy cập [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Tạo account và cluster miễn phí (512MB)
3. Tạo database user:
   - Username: `equipment_admin`
   - Password: Tạo password mạnh
4. Network Access → Add IP: `0.0.0.0/0` (Allow all)
5. Copy connection string:
   ```
   mongodb+srv://equipment_admin:<password>@cluster0.xxxxx.mongodb.net/equipment-management
   ```

### Bước 2: Setup Railway

1. Truy cập [Railway.app](https://railway.app)
2. Sign up bằng GitHub account
3. Connect repository này
4. Railway sẽ auto-detect Node.js app

### Bước 3: Cấu hình Environment Variables

Trong Railway Dashboard → Variables, thêm:

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://equipment_admin:<password>@cluster0.xxxxx.mongodb.net/equipment-management
JWT_SECRET=super-secret-jwt-key-2024-equipment-management
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-netlify-app.netlify.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ADMIN_EMAIL=admin@quanlythietbi.edu.vn
ADMIN_PASSWORD=Admin123@
```

### Bước 4: Deploy

1. Push code lên GitHub repository
2. Railway sẽ auto-deploy
3. Sau khi deploy xong, bạn sẽ có URL: `https://your-app.up.railway.app`

### Bước 5: Setup Admin Account

Chạy script tạo admin trong Railway console:
```bash
node scripts/createFirstAdmin.js
```

### Bước 6: Test API

Test các endpoint:
- Health: `https://your-app.up.railway.app/health`
- Login: `POST https://your-app.up.railway.app/api/auth/login`

## 🎯 Option 2: Deploy với Render

### Bước 1: Setup Render

1. Truy cập [Render.com](https://render.com)
2. Connect GitHub repository
3. Chọn "Web Service"

### Bước 2: Cấu hình

- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment:** `Node`

### Bước 3: Environment Variables

Thêm tương tự như Railway

### ⚠️ Lưu ý Render:
- Service sẽ "sleep" sau 15 phút không hoạt động
- Khởi động lại mất 30s-1p khi có request đầu tiên

## 🔗 Kết nối với Frontend Netlify

### Cập nhật Frontend

Trong frontend code, thay đổi API URL:

```javascript
// config/api.js hoặc constants.js
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-railway-app.up.railway.app/api'
  : 'http://localhost:5000/api';

export default API_BASE_URL;
```

### Cập nhật CORS trong Backend

Trong Railway Environment Variables, cập nhật:
```bash
CLIENT_URL=https://your-netlify-app.netlify.app
```

## ✅ Checklist Deploy

- [ ] MongoDB Atlas cluster đã tạo
- [ ] Environment variables đã setup
- [ ] Railway/Render app đã deploy thành công  
- [ ] Admin account đã tạo
- [ ] API endpoints test OK
- [ ] CORS cấu hình đúng Netlify URL
- [ ] Frontend đã cập nhật API URL

## 🐛 Troubleshooting

### Lỗi CORS
- Kiểm tra `CLIENT_URL` environment variable
- Đảm bảo Netlify URL chính xác (không có trailing slash)

### Lỗi Database Connection
- Kiểm tra `MONGODB_URI` 
- Đảm bảo IP whitelist: `0.0.0.0/0`
- Test connection string trên MongoDB Compass

### Lỗi 500 Internal Server Error
- Check Railway/Render logs
- Kiểm tra environment variables
- Test locally trước khi deploy

## 💡 Tips

1. **Free Tier Limits:**
   - Railway: $5 credit/tháng (~ 20 ngày)
   - Render: 750h/tháng (~ 31 ngày nhưng có sleep)

2. **Performance:**
   - Railway performance tốt hơn Render
   - Render có cold start delay

3. **Monitoring:**
   - Dùng health check endpoint để monitor
   - Setup uptime monitoring (UptimeRobot miễn phí)

4. **Security:**
   - Đổi JWT_SECRET thành random string mạnh
   - Đổi admin password mặc định
   - Enable MongoDB authentication 