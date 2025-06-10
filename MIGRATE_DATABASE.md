# 🔄 Migrate MongoDB Local → Atlas (An toàn)

## ⚠️ LƯU Ý QUAN TRỌNG

**KHÔNG XÓA** MongoDB local cho đến khi Atlas hoạt động 100% OK!

## 📋 Plan Migration (Không mất dữ liệu)

### Bước 1: Backup dữ liệu hiện tại (5 phút)

```bash
# Tạo thư mục backup
mkdir database-backup

# Export tất cả collections
mongodump --db equipment-management --out database-backup/

# Kiểm tra backup thành công
ls database-backup/equipment-management/
# Phải thấy: users.bson, equipment.bson, borrowrequests.bson, etc.
```

### Bước 2: Setup MongoDB Atlas (10 phút)

1. **Tạo account:** [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. **Create cluster:** Chọn FREE tier (M0 Sandbox - 512MB)
3. **Cluster name:** `equipment-management-cluster`
4. **Provider:** AWS/Google (gần Việt Nam nhất)

### Bước 3: Cấu hình Access (3 phút)

**Database Access:**
- Username: `equipment_admin`
- Password: Tạo password mạnh (lưu lại!)
- Role: `Atlas admin`

**Network Access:**
- Add IP: `0.0.0.0/0` (Allow all)
- Comment: "Allow all IPs for deployment"

### Bước 4: Get Connection String (2 phút)

1. Click **"Connect"** → **"Connect your application"**
2. Copy connection string:
   ```
   mongodb+srv://tatienloc11:Cdkcmkvl123.@my-backend-cluster.4gmo3bj.mongodb.net/?retryWrites=true&w=majority&appName=my-backend-cluster
   ```
3. Thay `<password>` bằng password thật

### Bước 5: Test Connection Local → Atlas (5 phút)

Tạo file test connection:
```javascript
// testAtlas.js
const mongoose = require('mongoose');

const ATLAS_URI = 'mongodb+srv://tatienloc11:Cdkcmkvl123.@my-backend-cluster.4gmo3bj.mongodb.net/?retryWrites=true&w=majority&appName=my-backend-cluster';

async function testConnection() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Atlas connection successful!');
    
    // Test tạo collection
    const testCollection = mongoose.connection.db.collection('test');
    await testCollection.insertOne({ test: 'success', date: new Date() });
    console.log('✅ Write test successful!');
    
    await mongoose.disconnect();
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
```

Chạy test:
```bash
node testAtlas.js
```

### Bước 6: Migrate Data với MongoDB Tools (10 phút)

**Option A: Dùng MongoDB Compass (GUI - Dễ hơn)**

1. Tải [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Kết nối local: `mongodb://localhost:27017`
3. Kết nối Atlas: Connection string từ bước 4
4. Copy paste từng collection local → Atlas

**Option B: Dùng Command Line**

```bash
# Restore backup vào Atlas
mongorestore --uri="mongodb+srv://tatienloc11:Cdkcmkvl123.@my-backend-cluster.4gmo3bj.mongodb.net/?retryWrites=true&w=majority&appName=my-backend-cluster" database-backup/equipment-management/
```

### Bước 7: Verify Data Migration (5 phút)

Tạo script kiểm tra:
```javascript
// verifyMigration.js
const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://localhost:27017/equipment-management';
const ATLAS_URI = 'mongodb+srv://tatienloc11:Cdkcmkvl123.@my-backend-cluster.4gmo3bj.mongodb.net/?retryWrites=true&w=majority&appName=my-backend-cluster';

async function compareData() {
  // Connect to local
  const localConn = await mongoose.createConnection(LOCAL_URI);
  
  // Connect to Atlas  
  const atlasConn = await mongoose.createConnection(ATLAS_URI);
  
  const collections = ['users', 'equipment', 'borrowrequests'];
  
  for (const collName of collections) {
    const localCount = await localConn.db.collection(collName).countDocuments();
    const atlasCount = await atlasConn.db.collection(collName).countDocuments();
    
    console.log(`📊 ${collName}:`);
    console.log(`   Local: ${localCount} documents`);
    console.log(`   Atlas: ${atlasCount} documents`);
    console.log(`   ✅ Match: ${localCount === atlasCount ? 'YES' : 'NO'}`);
  }
  
  await localConn.close();
  await atlasConn.close();
}

compareData();
```

### Bước 8: Update Backend Config (1 phút)

**CHỈ SAU KHI VERIFY OK**, cập nhật `.env`:

```bash
# Comment local database
# MONGODB_URI=mongodb://localhost:27017/equipment-management

# Use Atlas
MONGODB_URI=mongodb+srv://tatienloc11:Cdkcmkvl123.@my-backend-cluster.4gmo3bj.mongodb.net/?retryWrites=true&w=majority&appName=my-backend-cluster
```

### Bước 9: Test Backend với Atlas (5 phút)

```bash
# Restart server
npm run dev

# Test API
curl http://localhost:5000/health
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@quanlythietbi.edu.vn","password":"Admin123@"}'
```

## ✅ Checklist Migration

- [ ] Backup local database thành công
- [ ] Atlas cluster đã tạo
- [ ] Connection string test OK
- [ ] Data migrate hoàn tất
- [ ] Verify data counts match
- [ ] Backend test với Atlas OK
- [ ] Admin login thành công

## 🚨 Rollback Plan (Nếu có lỗi)

**Nếu Atlas có vấn đề:**
1. Đổi lại `.env` về local:
   ```bash
   MONGODB_URI=mongodb://localhost:27017/equipment-management
   ```
2. Restart server
3. Mọi thứ về như cũ!

## 💡 Pro Tips

1. **Giữ local database** cho đến khi deploy production hoàn tất
2. **Test kỹ trên Atlas** trước khi deploy
3. **Backup định kỳ:** Atlas có auto-backup nhưng nên export thủ công
4. **Monitor performance:** Atlas free tier có limit
5. **Connection pooling:** Atlas tự động handle

## 🔍 Troubleshooting

**Lỗi Connection Timeout:**
- Kiểm tra Network Access whitelist
- Thử IP khác: current IP + 0.0.0.0/0

**Lỗi Authentication:**
- Check username/password
- Đảm bảo user có quyền đúng database

**Slow Performance:**
- Atlas free tier có giới hạn
- Optimize queries nếu cần 