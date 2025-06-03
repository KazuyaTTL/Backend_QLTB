const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Equipment = require('../models/Equipment');

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/equipment_management';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});
    
    // Create admin user
    const admin = await User.create({
      fullName: 'Admin System',
      email: 'admin@equipment.com',
      password: 'admin123456',
      role: 'admin',
      phone: '0123456789'
    });
    
    // Create sample students
    const students = [
      {
        studentId: 'SV001',
        fullName: 'Nguyễn Văn An',
        email: 'student1@student.edu.vn',
        password: 'student123',
        role: 'student',
        phone: '0987654321',
        faculty: 'Công nghệ thông tin',
        class: 'CNTT01'
      },
      {
        studentId: 'SV002',
        fullName: 'Trần Thị Bình',
        email: 'student2@student.edu.vn',
        password: 'student123',
        role: 'student',
        phone: '0987654322',
        faculty: 'Điện tử viễn thông',
        class: 'DTVT01'
      },
      {
        studentId: 'SV003',
        fullName: 'Lê Văn Cường',
        email: 'student3@student.edu.vn',
        password: 'student123',
        role: 'student',
        phone: '0987654323',
        faculty: 'Cơ khí',
        class: 'CK01'
      }
    ];
    
    const createdStudents = await User.insertMany(students);
    
    console.log('✅ Users seeded successfully');
    console.log(`Created 1 admin and ${students.length} students`);
    
    return { admin, students: createdStudents };
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

const seedEquipment = async (adminId) => {
  try {
    // Clear existing equipment
    await Equipment.deleteMany({});
    
    const equipmentData = [
      {
        name: 'Laptop Dell Inspiron 15',
        code: 'LAPTOP001',
        category: 'electronics',
        description: 'Laptop phục vụ học tập và nghiên cứu',
        specifications: 'CPU: Intel i5, RAM: 8GB, Storage: 256GB SSD',
        totalQuantity: 10,
        availableQuantity: 8,
        borrowedQuantity: 2,
        condition: 'good',
        location: {
          building: 'A',
          floor: '2',
          room: 'A201'
        },
        purchaseDate: new Date('2023-01-15'),
        purchasePrice: 15000000,
        warrantyExpiry: new Date('2026-01-15'),
        createdBy: adminId
      },
      {
        name: 'Máy chiếu Epson EB-X41',
        code: 'PROJ001',
        category: 'audio_visual',
        description: 'Máy chiếu cho phòng học và hội thảo',
        specifications: 'Độ phân giải: XGA (1024×768), Độ sáng: 3600 lumens',
        totalQuantity: 5,
        availableQuantity: 4,
        borrowedQuantity: 1,
        condition: 'good',
        location: {
          building: 'B',
          floor: '1',
          room: 'B101'
        },
        purchaseDate: new Date('2023-03-20'),
        purchasePrice: 12000000,
        warrantyExpiry: new Date('2026-03-20'),
        createdBy: adminId
      },
      {
        name: 'Micro không dây Shure',
        code: 'MIC001',
        category: 'audio_visual',
        description: 'Micro không dây cho sự kiện và thuyết trình',
        specifications: 'Tần số: UHF, Phạm vi: 100m, Pin: 8 hours',
        totalQuantity: 8,
        availableQuantity: 8,
        borrowedQuantity: 0,
        condition: 'new',
        location: {
          building: 'A',
          floor: '1',
          room: 'A105'
        },
        purchaseDate: new Date('2023-06-10'),
        purchasePrice: 3500000,
        warrantyExpiry: new Date('2025-06-10'),
        createdBy: adminId
      },
      {
        name: 'Bàn học nhóm',
        code: 'TABLE001',
        category: 'furniture',
        description: 'Bàn học nhóm có thể gấp gọn',
        specifications: 'Kích thước: 120x80x75cm, Chất liệu: Gỗ công nghiệp',
        totalQuantity: 20,
        availableQuantity: 18,
        borrowedQuantity: 2,
        condition: 'good',
        location: {
          building: 'C',
          floor: '1',
          room: 'C102'
        },
        purchaseDate: new Date('2022-12-01'),
        purchasePrice: 2500000,
        createdBy: adminId
      },
      {
        name: 'Camera Sony FX3',
        code: 'CAM001',
        category: 'electronics',
        description: 'Camera quay phim chuyên nghiệp',
        specifications: 'Sensor: Full-frame, Resolution: 4K, ISO: 80-102400',
        totalQuantity: 3,
        availableQuantity: 2,
        borrowedQuantity: 1,
        condition: 'new',
        location: {
          building: 'D',
          floor: '3',
          room: 'D301'
        },
        purchaseDate: new Date('2023-09-15'),
        purchasePrice: 85000000,
        warrantyExpiry: new Date('2025-09-15'),
        createdBy: adminId
      },
      {
        name: 'Kính hiển vi quang học',
        code: 'MICRO001',
        category: 'laboratory',
        description: 'Kính hiển vi cho thí nghiệm sinh học',
        specifications: 'Phóng đại: 40x-1000x, Độ phân giải: 0.2μm',
        totalQuantity: 15,
        availableQuantity: 12,
        borrowedQuantity: 3,
        condition: 'good',
        location: {
          building: 'E',
          floor: '2',
          room: 'E201'
        },
        purchaseDate: new Date('2022-08-20'),
        purchasePrice: 12000000,
        warrantyExpiry: new Date('2025-08-20'),
        createdBy: adminId
      }
    ];
    
    const createdEquipment = await Equipment.insertMany(equipmentData);
    
    console.log('✅ Equipment seeded successfully');
    console.log(`Created ${equipmentData.length} equipment items`);
    
    return createdEquipment;
  } catch (error) {
    console.error('Error seeding equipment:', error);
    throw error;
  }
};

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Seed users first
    const { admin, students } = await seedUsers();
    
    // Seed equipment with admin as creator
    await seedEquipment(admin._id);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Admin user: admin@equipment.com / admin123456');
    console.log(`- ${students.length} student users created`);
    console.log('- Sample equipment data created');
    console.log('\n🚀 You can now start the server with: npm run dev');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedData();
}

module.exports = { seedData, seedUsers, seedEquipment }; 