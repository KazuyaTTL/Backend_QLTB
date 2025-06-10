const mongoose = require('mongoose');
require('dotenv').config();

async function testAtlasConnection() {
  console.log('🔍 Testing MongoDB Atlas Connection...\n');
  
  const atlasUri = process.env.MONGODB_URI;
  
  if (!atlasUri || !atlasUri.includes('mongodb+srv://')) {
    console.error('❌ MONGODB_URI không phải Atlas connection string!');
    console.log('💡 Atlas URI phải có dạng: mongodb+srv://...');
    process.exit(1);
  }
  
  try {
    console.log('📡 Đang kết nối tới Atlas...');
    await mongoose.connect(atlasUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Kết nối Atlas thành công!');
    
    // Test database access
    const dbName = mongoose.connection.name;
    console.log(`📂 Database: ${dbName}`);
    
    // Test write permission
    console.log('📝 Testing write permission...');
    const testCollection = mongoose.connection.db.collection('connection_test');
    await testCollection.insertOne({ 
      test: 'success', 
      timestamp: new Date(),
      message: 'Atlas connection working!'
    });
    console.log('✅ Write test thành công!');
    
    // Clean up test data
    await testCollection.deleteOne({ test: 'success' });
    console.log('🧹 Cleanup test data hoàn tất');
    
    // List existing collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Collections hiện có:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    console.log('\n🎉 Atlas connection test hoàn tất! Sẵn sàng deploy.');
    
  } catch (error) {
    console.error('❌ Lỗi kết nối Atlas:');
    console.error(`   ${error.message}`);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Hướng dẫn sửa lỗi authentication:');
      console.log('   1. Kiểm tra username/password trong connection string');
      console.log('   2. Đảm bảo user có quyền read/write database');
      console.log('   3. Kiểm tra database name trong URI');
    }
    
    if (error.message.includes('connection attempt failed')) {
      console.log('\n💡 Hướng dẫn sửa lỗi connection:');
      console.log('   1. Kiểm tra Network Access trong Atlas');
      console.log('   2. Add IP: 0.0.0.0/0 để allow all IPs');
      console.log('   3. Kiểm tra connection string format');
    }
    
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối');
  }
}

testAtlasConnection(); 