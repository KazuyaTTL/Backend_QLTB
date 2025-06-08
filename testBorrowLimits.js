const User = require('./models/User');
const BorrowRequest = require('./models/BorrowRequest');
require('./config/database');

async function testBorrowLimits() {
  try {
    console.log('🧪 TESTING BORROW LIMITS SCENARIOS\n');

    // Tìm user SV001
    const user = await User.findOne({ studentId: 'SV001' });
    if (!user) {
      console.log('❌ Không tìm thấy user SV001');
      return;
    }

    console.log('👤 USER INFO:');
    console.log(`   Name: ${user.fullName}`);
    console.log(`   Current borrow count: ${user.currentBorrowCount}`);
    console.log(`   Borrow limit: ${user.borrowLimit}`);
    console.log(`   Is restricted: ${user.isRestricted}\n`);

    // Test canBorrow (chỉ tính current)
    console.log('🔍 TESTING canBorrow() method:');
    for (let qty = 1; qty <= 5; qty++) {
      const result = user.canBorrow(qty);
      console.log(`   Request ${qty} items: ${result.allowed ? '✅ ALLOWED' : '❌ DENIED'}`);
      if (!result.allowed) console.log(`      Reason: ${result.reason}`);
    }

    console.log('\n🔍 TESTING canCreateRequest() method (includes pending):');
    for (let qty = 1; qty <= 5; qty++) {
      const result = await user.canCreateRequest(qty);
      console.log(`   Request ${qty} items: ${result.allowed ? '✅ ALLOWED' : '❌ DENIED'}`);
      if (!result.allowed) {
        console.log(`      Reason: ${result.reason}`);
      } else {
        console.log(`      Current: ${result.currentCount}, Pending: ${result.pendingCount}, Total: ${result.total}/${result.limit}`);
      }
    }

    // Lấy pending requests
    console.log('\n📋 CURRENT PENDING REQUESTS:');
    const pendingRequests = await BorrowRequest.find({
      borrower: user._id,
      status: 'pending'
    }).populate('equipments.equipment', 'name');

    let totalPending = 0;
    pendingRequests.forEach((req, index) => {
      const quantity = req.equipments.reduce((sum, item) => sum + item.quantity, 0);
      totalPending += quantity;
      console.log(`   ${index + 1}. ${req.requestNumber}: ${quantity} items`);
      req.equipments.forEach(item => {
        console.log(`      - ${item.equipment.name} x${item.quantity}`);
      });
    });
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Currently borrowing: ${user.currentBorrowCount} items`);
    console.log(`   Pending requests: ${totalPending} items`);
    console.log(`   Total committed: ${user.currentBorrowCount + totalPending} items`);
    console.log(`   Borrow limit: ${user.borrowLimit} items`);
    console.log(`   Available slots: ${user.borrowLimit - user.currentBorrowCount - totalPending} items`);
    console.log(`   Exceeds limit: ${user.currentBorrowCount + totalPending > user.borrowLimit ? '⚠️  YES' : '✅ NO'}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testBorrowLimits(); 