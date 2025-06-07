const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Thông tin admin đầu tiên
const FIRST_ADMIN = {
  fullName: 'Quản trị viên hệ thống',
  email: 'admin@quanlythietbi.edu.vn',
  password: 'Admin123@',
  role: 'admin'
};

const createFirstAdmin = async () => {
  try {
    // Kết nối database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/equipment-management');
    console.log('✅ Đã kết nối MongoDB');

    // Kiểm tra xem đã có admin nào chưa
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Đã có tài khoản admin trong hệ thống:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Họ tên: ${existingAdmin.fullName}`);
      console.log('   Không cần tạo admin mới.');
      process.exit(0);
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email: FIRST_ADMIN.email });
    if (existingUser) {
      console.log(`❌ Email ${FIRST_ADMIN.email} đã được sử dụng.`);
      console.log('   Vui lòng sửa email trong script và chạy lại.');
      process.exit(1);
    }

    // Tạo admin đầu tiên
    const admin = await User.create(FIRST_ADMIN);
    
    console.log('🎉 Tạo tài khoản admin đầu tiên thành công!');
    console.log('📧 Thông tin đăng nhập:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Mật khẩu: ${FIRST_ADMIN.password}`);
    console.log(`   Họ tên: ${admin.fullName}`);
    console.log(`   Role: ${admin.role}`);
    console.log('');
    console.log('🔒 Lưu ý bảo mật:');
    console.log('   - Hãy đăng nhập và đổi mật khẩu ngay lập tức');
    console.log('   - Xóa hoặc bảo mật file script này sau khi sử dụng');

  } catch (error) {
    console.error('❌ Lỗi khi tạo admin:', error.message);
    process.exit(1);
  } finally {
    // Đóng kết nối
    await mongoose.connection.close();
    console.log('🔌 Đã đóng kết nối MongoDB');
  }
};

// Chạy script
if (require.main === module) {
  createFirstAdmin();
}

module.exports = createFirstAdmin; 