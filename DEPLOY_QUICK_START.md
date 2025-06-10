# ⚡ Deploy Backend - Hướng dẫn nhanh

## 🎯 Tóm tắt: Backend → Railway + Frontend → Netlify

### 1. Chuẩn bị (5 phút)
```bash
# 1. Push code lên GitHub repository
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Tạo MongoDB Atlas cluster miễn phí tại mongodb.com
```

### 2. Deploy Backend lên Railway (10 phút)

1. **Truy cập:** [railway.app](https://railway.app)
2. **Login:** Bằng GitHub
3. **New Project:** → "Deploy from GitHub repo" → Chọn repo này
4. **Environment Variables:** (Tab Variables)
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/equipment-management
   JWT_SECRET=your-secret-key-here
   CLIENT_URL=https://your-netlify-app.netlify.app
   ```
5. **Deploy:** Railway sẽ auto-deploy
6. **URL:** Bạn sẽ có `https://your-app.up.railway.app`

### 3. Kết nối Frontend (2 phút)

Trong frontend code Netlify, cập nhật API URL:
```javascript
const API_URL = 'https://your-app.up.railway.app/api';
```

### 4. Test (1 phút)
```bash
# Test health check
curl https://your-app.up.railway.app/health

# Test login
curl -X POST https://your-app.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@quanlythietbi.edu.vn","password":"Admin123@"}'
```

## ✅ Done!

Frontend Netlify ↔️ Backend Railway ↔️ MongoDB Atlas

**Total time:** ~18 phút
**Cost:** $0 (free tier)

---

📖 **Chi tiết:** Xem `DEPLOYMENT.md`
🐛 **Lỗi:** Check Railway logs hoặc MongoDB Atlas network access 