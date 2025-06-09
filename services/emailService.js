// Email Service cho hệ thống quản lý thiết bị
const BorrowRequest = require('../models/BorrowRequest');
const notificationService = require('./notificationService');

// Function để kiểm tra và gửi cảnh báo hạn trả
exports.checkAndSendDueDateWarnings = async () => {
  try {
    console.log('🔔 Bắt đầu kiểm tra và gửi cảnh báo hạn trả...');
    
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000));
    
    // Tìm các yêu cầu sắp đến hạn trả (2 ngày tới)
    const dueSoonRequests = await BorrowRequest.find({
      status: 'borrowed',
      expectedReturnDate: {
        $gte: now,
        $lte: twoDaysFromNow
      }
    }).populate('borrower', 'fullName email')
      .populate('equipments.equipment', 'name code');
    
    // Tìm các yêu cầu đã quá hạn
    const overdueRequests = await BorrowRequest.find({
      status: 'borrowed',
      expectedReturnDate: { $lt: now }
    }).populate('borrower', 'fullName email')
      .populate('equipments.equipment', 'name code');
    
    let dueSoonWarnings = 0;
    let overdueWarnings = 0;
    const details = [];
    
    // Gửi thông báo cho các yêu cầu sắp hết hạn
    for (const request of dueSoonRequests) {
      try {
        await notificationService.createReturnReminderNotification(request);
        dueSoonWarnings++;
        details.push({
          type: 'due_soon',
          requestNumber: request.requestNumber,
          borrower: request.borrower.fullName,
          expectedReturnDate: request.expectedReturnDate
        });
      } catch (error) {
        console.error(`❌ Lỗi gửi thông báo sắp hết hạn cho ${request.requestNumber}:`, error.message);
      }
    }
    
    // Gửi thông báo cho các yêu cầu quá hạn
    for (const request of overdueRequests) {
      try {
        await notificationService.createOverdueNotification(request);
        overdueWarnings++;
        details.push({
          type: 'overdue',
          requestNumber: request.requestNumber,
          borrower: request.borrower.fullName,
          expectedReturnDate: request.expectedReturnDate,
          overdueDays: Math.ceil((now - request.expectedReturnDate) / (1000 * 60 * 60 * 24))
        });
      } catch (error) {
        console.error(`❌ Lỗi gửi thông báo quá hạn cho ${request.requestNumber}:`, error.message);
      }
    }
    
    const totalWarningsSent = dueSoonWarnings + overdueWarnings;
    
    console.log(`✅ Hoàn thành gửi cảnh báo: ${totalWarningsSent} thông báo (${dueSoonWarnings} sắp hết hạn, ${overdueWarnings} quá hạn)`);
    
    return {
      success: true,
      totalWarningsSent,
      dueSoonWarnings,
      overdueWarnings,
      details,
      summary: {
        dueSoonCount: dueSoonRequests.length,
        overdueCount: overdueRequests.length,
        sentAt: new Date()
      }
    };
  } catch (error) {
    console.error('❌ Lỗi service gửi cảnh báo:', error);
    return {
      success: false,
      error: error.message,
      totalWarningsSent: 0,
      dueSoonWarnings: 0,
      overdueWarnings: 0
    };
  }
};

// Placeholder function cho việc gửi email thông báo
exports.sendNotificationEmail = async (to, subject, content) => {
  try {
    // TODO: Implement email sending logic
    console.log(`📧 Gửi email đến ${to}: ${subject} (chưa được triển khai)`);
    
    return {
      success: true,
      message: 'Email đã được gửi (mô phỏng)'
    };
  } catch (error) {
    console.error('Lỗi gửi email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Placeholder function cho việc gửi email xác nhận
exports.sendConfirmationEmail = async (to, action, details) => {
  try {
    // TODO: Implement confirmation email logic
    console.log(`✅ Gửi email xác nhận đến ${to} cho hành động: ${action} (chưa được triển khai)`);
    
    return {
      success: true,
      message: 'Email xác nhận đã được gửi (mô phỏng)'
    };
  } catch (error) {
    console.error('Lỗi gửi email xác nhận:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 