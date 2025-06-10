const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function backupLocalDatabase() {
  console.log('📦 Backup MongoDB Local Database...\n');
  
  const backupDir = path.join(__dirname, '..', 'database-backup');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup-${timestamp}`);
  
  // Tạo thư mục backup
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log('📁 Đã tạo thư mục backup');
  }
  
  console.log(`📍 Backup location: ${backupPath}`);
  
  // Kiểm tra MongoDB đang chạy
  console.log('🔍 Checking MongoDB connection...');
  
  return new Promise((resolve, reject) => {
    // Test connection trước
    exec('mongo --eval "db.runCommand({ping: 1})" equipment-management --quiet', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Không thể kết nối MongoDB local!');
        console.error('💡 Đảm bảo MongoDB đang chạy: mongod');
        reject(error);
        return;
      }
      
      console.log('✅ MongoDB connection OK');
      console.log('📤 Bắt đầu export data...');
      
      // Thực hiện backup
      const backupCommand = `mongodump --db equipment-management --out "${backupPath}"`;
      
      exec(backupCommand, (backupError, backupStdout, backupStderr) => {
        if (backupError) {
          console.error('❌ Backup failed:', backupError.message);
          reject(backupError);
          return;
        }
        
        console.log('✅ Backup thành công!');
        console.log(`📂 Backup saved to: ${backupPath}`);
        
        // Liệt kê files backup
        const equipmentBackupDir = path.join(backupPath, 'equipment-management');
        if (fs.existsSync(equipmentBackupDir)) {
          const files = fs.readdirSync(equipmentBackupDir);
          console.log('\n📋 Backup files:');
          files.forEach(file => {
            const filePath = path.join(equipmentBackupDir, file);
            const stats = fs.statSync(filePath);
            console.log(`   - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
          });
        }
        
        console.log('\n🎉 Backup hoàn tất! Dữ liệu của bạn đã được bảo vệ.');
        console.log('\n📝 Ghi chú:');
        console.log('   - Backup này có thể restore bằng mongorestore');
        console.log('   - Giữ backup này cho đến khi Atlas hoạt động ổn định');
        console.log('   - Để restore: mongorestore --db equipment-management ' + backupPath + '/equipment-management');
        
        resolve(backupPath);
      });
    });
  });
}

// Chạy backup nếu file được execute trực tiếp
if (require.main === module) {
  backupLocalDatabase()
    .then(() => {
      console.log('\n✨ Script hoàn tất!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = backupLocalDatabase; 