const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAtlasAPI() {
  console.log('🧪 Testing API with Atlas Database\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', health.data.message);
    
    // Test 2: Get equipment list
    console.log('\n2️⃣ Testing equipment list...');
    const equipment = await axios.get(`${BASE_URL}/equipment`);
    console.log(`✅ Equipment loaded: ${equipment.data.length} items`);
    
    // Test 3: Login admin
    console.log('\n3️⃣ Testing admin login...');
    const login = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@quanlythietbi.edu.vn',
      password: 'Admin123@'
    });
    console.log('✅ Admin login successful');
    const token = login.data.token;
    
    // Test 4: Get profile with token
    console.log('\n4️⃣ Testing authenticated profile...');
    const profile = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Profile loaded: ${profile.data.name} (${profile.data.role})`);
    
    // Test 5: Get borrow requests
    console.log('\n5️⃣ Testing borrow requests...');
    const borrowRequests = await axios.get(`${BASE_URL}/borrow-requests`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Borrow requests loaded: ${borrowRequests.data.length} requests`);
    
    console.log('\n🎉 ✅ Tất cả API tests thành công với Atlas!');
    console.log('📝 Server đang chạy tốt với database cloud');
    
  } catch (error) {
    console.error('❌ API Test Failed:');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Server chưa khởi động hoặc port 3000 bị chiếm');
      console.log('   - Chạy: npm start');
      console.log('   - Hoặc kiểm tra port khác');
    } else if (error.response) {
      console.log(`📍 HTTP ${error.response.status}: ${error.response.data.message || error.response.data}`);
    } else {
      console.log(`🔍 Error: ${error.message}`);
    }
    
    process.exit(1);
  }
}

testAtlasAPI(); 