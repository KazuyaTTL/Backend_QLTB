const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://localhost:27017/equipment-management';
const ATLAS_URI = 'mongodb+srv://tatienloc11:Cdkcmkvl123.@my-backend-cluster.4gmo3bj.mongodb.net/equipment-management?retryWrites=true&w=majority&appName=my-backend-cluster';

async function migrateData() {
  console.log('🔄 Migrate Data: Local → Atlas\n');
  
  let localConn, atlasConn;
  
  try {
    // Connect to local
    console.log('🔍 Connecting to Local MongoDB...');
    localConn = await mongoose.createConnection(LOCAL_URI);
    
    // Wait for connection to be ready
    await new Promise((resolve, reject) => {
      localConn.once('connected', resolve);
      localConn.once('error', reject);
      setTimeout(() => reject(new Error('Local connection timeout')), 10000);
    });
    
    console.log('✅ Local connected');
    console.log(`📂 Local database: ${localConn.name}`);
    
    // Connect to Atlas
    console.log('🔍 Connecting to Atlas...');
    atlasConn = await mongoose.createConnection(ATLAS_URI);
    
    // Wait for connection to be ready
    await new Promise((resolve, reject) => {
      atlasConn.once('connected', resolve);
      atlasConn.once('error', reject);
      setTimeout(() => reject(new Error('Atlas connection timeout')), 10000);
    });
    
    console.log('✅ Atlas connected');
    console.log(`📂 Atlas database: ${atlasConn.name}`);
    
    // Kiểm tra xem database có tồn tại không
    if (!localConn.db) {
      throw new Error('Local database không khả dụng');
    }
    
    if (!atlasConn.db) {
      throw new Error('Atlas database không khả dụng');
    }
    
    // Get collections from local
    console.log('\n🔍 Đang lấy danh sách collections từ Local...');
    const localCollections = await localConn.db.listCollections().toArray();
    console.log(`📋 Tìm thấy ${localCollections.length} collections trong Local:`);
    
    if (localCollections.length === 0) {
      console.log('⚠️  Không có collections nào trong database local!');
      console.log('💡 Kiểm tra xem database có tên đúng không: equipment-management');
      return;
    }
    
    localCollections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    const migrationSummary = {
      collections: {},
      totalDocuments: 0,
      startTime: new Date()
    };
    
    for (const collInfo of localCollections) {
      const collName = collInfo.name;
      console.log(`\n📤 Migrating collection: ${collName}`);
      
      // Get documents from local
      const localCollection = localConn.db.collection(collName);
      const documents = await localCollection.find({}).toArray();
      
      console.log(`   📊 Documents to migrate: ${documents.length}`);
      
      if (documents.length > 0) {
        // Insert to Atlas
        const atlasCollection = atlasConn.db.collection(collName);
        
        // Clear existing data in Atlas collection (optional)
        const existingCount = await atlasCollection.countDocuments();
        if (existingCount > 0) {
          console.log(`   🧹 Clearing ${existingCount} existing documents in Atlas`);
          await atlasCollection.deleteMany({});
        }
        
        // Insert new data
        await atlasCollection.insertMany(documents);
        console.log(`   ✅ Migrated ${documents.length} documents`);
        
        // Verify
        const atlasCount = await atlasCollection.countDocuments();
        console.log(`   🔍 Verification: ${atlasCount} documents in Atlas`);
        
        migrationSummary.collections[collName] = {
          local: documents.length,
          atlas: atlasCount,
          success: documents.length === atlasCount
        };
        migrationSummary.totalDocuments += documents.length;
      } else {
        console.log(`   ⚠️  Collection empty, skipping`);
        migrationSummary.collections[collName] = {
          local: 0,
          atlas: 0,
          success: true
        };
      }
    }
    
    // Summary
    console.log('\n🎉 Migration hoàn tất!');
    console.log('\n📊 MIGRATION SUMMARY:');
    console.log(`⏱️  Time: ${new Date() - migrationSummary.startTime}ms`);
    console.log(`📈 Total documents: ${migrationSummary.totalDocuments}`);
    
    let allSuccess = true;
    console.log('\n📋 Collections:');
    Object.keys(migrationSummary.collections).forEach(collName => {
      const summary = migrationSummary.collections[collName];
      const status = summary.success ? '✅' : '❌';
      console.log(`   ${status} ${collName}: ${summary.local} → ${summary.atlas}`);
      if (!summary.success) allSuccess = false;
    });
    
    if (allSuccess) {
      console.log('\n🎉 ✅ Tất cả migration thành công!');
      console.log('📝 Bạn có thể cập nhật .env để dùng Atlas làm database chính');
      console.log('\n💡 Để chuyển sang Atlas, cập nhật file .env:');
      console.log('   DATABASE_TYPE=atlas');
      console.log('   MONGODB_URI=mongodb+srv://...');
    } else {
      console.log('\n⚠️  ❌ Có lỗi trong quá trình migration!');
      console.log('📝 Kiểm tra lại data trước khi chuyển sang Atlas');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 MongoDB local không chạy:');
      console.log('   - Đảm bảo MongoDB service đang chạy');
      console.log('   - Hoặc start: net start MongoDB');
      console.log('   - Kiểm tra MongoDB Compass có connect được không');
    }
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Lỗi xác thực Atlas:');
      console.log('   - Kiểm tra username/password trong Atlas URI');
      console.log('   - Đảm bảo user có quyền read/write');
    }
    
    if (error.message.includes('timeout')) {
      console.log('\n💡 Lỗi timeout:');
      console.log('   - Kiểm tra kết nối internet');
      console.log('   - Atlas có thể đang bảo trì');
      console.log('   - Local MongoDB có thể khởi động chậm');
    }
    
    throw error;
  } finally {
    if (localConn) {
      await localConn.close();
      console.log('🔌 Local connection closed');
    }
    if (atlasConn) {
      await atlasConn.close();
      console.log('🔌 Atlas connection closed');
    }
  }
}

// Chạy migration
migrateData()
  .then(() => {
    console.log('\n✨ Migration script hoàn tất!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error.message);
    process.exit(1);
  }); 