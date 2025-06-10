const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const LOCAL_URI = 'mongodb://localhost:27017/equipment-management';

async function backupDatabase() {
  console.log('📦 Backup MongoDB Local Database với Mongoose...\n');
  
  const backupDir = path.join(__dirname, '..', 'database-backup');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup-${timestamp}.json`);
  
  // Tạo thư mục backup
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log('📁 Đã tạo thư mục backup');
  }
  
  try {
    console.log('🔍 Đang kết nối MongoDB local...');
    await mongoose.connect(LOCAL_URI);
    console.log('✅ Kết nối thành công!');
    
    const db = mongoose.connection.db;
    const backup = {
      timestamp: new Date(),
      database: 'equipment-management',
      collections: {}
    };
    
    // Lấy danh sách collections
    const collections = await db.listCollections().toArray();
    console.log(`📋 Tìm thấy ${collections.length} collections:`);
    
    for (const collectionInfo of collections) {
      const collName = collectionInfo.name;
      console.log(`📤 Backup collection: ${collName}`);
      
      const collection = db.collection(collName);
      const documents = await collection.find({}).toArray();
      
      backup.collections[collName] = documents;
      console.log(`   ✅ ${documents.length} documents`);
    }
    
    // Lưu backup file
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    
    console.log('\n🎉 Backup hoàn tất!');
    console.log(`📂 Backup file: ${backupPath}`);
    console.log(`📊 File size: ${(fs.statSync(backupPath).size / 1024 / 1024).toFixed(2)} MB`);
    
    // Tổng kết
    let totalDocuments = 0;
    Object.keys(backup.collections).forEach(collName => {
      const count = backup.collections[collName].length;
      totalDocuments += count;
      console.log(`   - ${collName}: ${count} documents`);
    });
    
    console.log(`📈 Tổng cộng: ${totalDocuments} documents`);
    console.log('\n📝 Ghi chú:');
    console.log('   - Backup này ở định dạng JSON');
    console.log('   - Có thể restore bằng script restoreDatabase.js');
    console.log('   - Giữ file này cho đến khi Atlas hoạt động ổn định');
    
    return backupPath;
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 MongoDB local không chạy:');
      console.log('   1. Mở Command Prompt as Administrator');
      console.log('   2. Chạy: net start MongoDB');
      console.log('   3. Hoặc: mongod --dbpath "C:\\data\\db"');
    }
    
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối');
  }
}

// Chạy backup nếu file được execute trực tiếp
if (require.main === module) {
  backupDatabase()
    .then(() => {
      console.log('\n✨ Script hoàn tất!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = backupDatabase; 