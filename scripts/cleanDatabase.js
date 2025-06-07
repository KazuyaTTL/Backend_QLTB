const mongoose = require('mongoose');
const User = require('../models/User');
const Equipment = require('../models/Equipment');
const BorrowRequest = require('../models/BorrowRequest');
require('dotenv').config();

const cleanDatabase = async () => {
  try {
    // Kết nối database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/equipment-management');
    console.log('✅ Đã kết nối MongoDB');

    console.log('🧹 Bắt đầu xóa dữ liệu...');

    // Đếm số lượng dữ liệu hiện tại
    const userCount = await User.countDocuments();
    const equipmentCount = await Equipment.countDocuments();
    const requestCount = await BorrowRequest.countDocuments();

    console.log(`📊 Dữ liệu hiện tại:`);
    console.log(`   👥 Users: ${userCount}`);
    console.log(`   🛠️  Equipment: ${equipmentCount}`);
    console.log(`   📋 Borrow Requests: ${requestCount}`);

    if (userCount === 0 && equipmentCount === 0 && requestCount === 0) {
      console.log('✨ Database đã sạch, không cần xóa gì thêm.');
      return;
    }

    console.log('\n🗑️  Đang xóa dữ liệu...');

    // Xóa tất cả users (admin + sinh viên cũ)
    const deletedUsers = await User.deleteMany({});
    console.log(`✅ Đã xóa ${deletedUsers.deletedCount} users`);

    // Xóa tất cả thiết bị
    const deletedEquipment = await Equipment.deleteMany({});
    console.log(`✅ Đã xóa ${deletedEquipment.deletedCount} thiết bị`);

    // Xóa tất cả yêu cầu mượn
    const deletedRequests = await BorrowRequest.deleteMany({});
    console.log(`✅ Đã xóa ${deletedRequests.deletedCount} yêu cầu mượn`);

    console.log('\n🎉 Xóa dữ liệu hoàn tất!');
    console.log('💡 Gợi ý tiếp theo:');
    console.log('   1. Chạy: npm run create-admin (tạo admin mới)');
    console.log('   2. Chạy: npm run seed (tạo dữ liệu mẫu - nếu có)');

  } catch (error) {
    console.error('❌ Lỗi khi xóa dữ liệu:', error.message);
    process.exit(1);
  } finally {
    // Đóng kết nối
    await mongoose.connection.close();
    console.log('🔌 Đã đóng kết nối MongoDB');
  }
};

// Hàm xóa chỉ users (giữ lại thiết bị và requests)
const cleanUsersOnly = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/equipment-management');
    console.log('✅ Đã kết nối MongoDB');

    const userCount = await User.countDocuments();
    console.log(`👥 Tìm thấy ${userCount} users`);

    if (userCount === 0) {
      console.log('✨ Không có users nào để xóa.');
      return;
    }

    // Xóa tất cả users
    const result = await User.deleteMany({});
    console.log(`🗑️  Đã xóa ${result.deletedCount} users (admin + sinh viên)`);
    
    console.log('💡 Bây giờ bạn có thể chạy: npm run create-admin');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Đã đóng kết nối MongoDB');
  }
};

// Kiểm tra tham số dòng lệnh
const args = process.argv.slice(2);
const command = args[0];

if (require.main === module) {
  if (command === 'users-only') {
    cleanUsersOnly();
  } else {
    cleanDatabase();
  }
}

module.exports = { cleanDatabase, cleanUsersOnly }; 