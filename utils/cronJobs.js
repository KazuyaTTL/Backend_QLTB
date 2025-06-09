const cron = require('node-cron');
const notificationService = require('../services/notificationService');

class CronJobs {
  // Khởi động tất cả cron jobs
  static start() {
    console.log('🕐 Khởi động cron jobs...');

    // Tạo thông báo nhắc nhở hàng ngày lúc 9:00 AM
    this.scheduleNotificationReminders();

    // Kiểm tra thiết bị quá hạn hàng ngày lúc 6:00 PM
    this.scheduleOverdueCheck();

    // Gửi báo cáo thống kê hàng tuần (Chủ nhật 8:00 AM)
    this.scheduleWeeklyReport();

    // Dọn dẹp thông báo cũ (mỗi tuần)
    this.scheduleNotificationCleanup();

    console.log('✅ Đã khởi động tất cả cron jobs');
  }

  // Tạo thông báo nhắc nhở hàng ngày lúc 9:00 AM
  static scheduleNotificationReminders() {
    cron.schedule('0 9 * * *', async () => {
      console.log('📱 Bắt đầu tạo thông báo nhắc nhở tự động...');
      
      try {
        const result = await notificationService.checkAndCreateDueDateReminders();
        
        if (result.success) {
          console.log(`✅ Đã tạo ${result.count} thông báo nhắc nhở tự động`);
        } else {
          console.error('❌ Lỗi tạo thông báo nhắc nhở tự động:', result.error);
        }
      } catch (error) {
        console.error('❌ Lỗi cron job tạo thông báo:', error.message);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Ho_Chi_Minh"
    });

    console.log('⏰ Đã lên lịch tạo thông báo nhắc nhở: 9:00 AM hàng ngày');
  }

  // Kiểm tra và tạo thông báo quá hạn lúc 6:00 PM
  static scheduleOverdueCheck() {
    cron.schedule('0 18 * * *', async () => {
      console.log('🔍 Bắt đầu kiểm tra thiết bị quá hạn...');
      
      try {
        const result = await notificationService.checkAndCreateOverdueNotifications();

        if (result.success) {
          console.log(`✅ Đã tạo ${result.count} thông báo quá hạn`);
        } else {
          console.error('❌ Lỗi tạo thông báo quá hạn:', result.error);
        }

      } catch (error) {
        console.error('❌ Lỗi cron job kiểm tra quá hạn:', error.message);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Ho_Chi_Minh"
    });

    console.log('⏰ Đã lên lịch kiểm tra quá hạn: 6:00 PM hàng ngày');
  }

  // Gửi báo cáo thống kê hàng tuần (Chủ nhật 8:00 AM)
  static scheduleWeeklyReport() {
    cron.schedule('0 8 * * 0', async () => {
      console.log('📊 Bắt đầu tạo báo cáo thống kê tuần...');
      
      try {
        const statisticsService = require('../services/statisticsService');
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        // Lấy thống kê tháng hiện tại
        const [equipmentStats, overview] = await Promise.all([
          statisticsService.getMostBorrowedEquipmentInMonth(currentYear, currentMonth),
          statisticsService.getMonthlyOverview(currentYear, currentMonth)
        ]);

        // Gửi email báo cáo (có thể implement sau)
        console.log('📈 Thống kê tuần:', {
          mostBorrowedCount: equipmentStats.statistics.length,
          totalRequests: overview.overview.totalRequests
        });

      } catch (error) {
        console.error('❌ Lỗi tạo báo cáo thống kê tuần:', error.message);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Ho_Chi_Minh"
    });

    console.log('⏰ Đã lên lịch báo cáo tuần: 8:00 AM Chủ nhật');
  }

  // Dọn dẹp thông báo cũ (mỗi tuần)
  static scheduleNotificationCleanup() {
    cron.schedule('0 2 * * 0', async () => {
      console.log('🧹 Bắt đầu dọn dẹp thông báo cũ...');
      
      try {
        const Notification = require('../models/Notification');
        
        // Xóa thông báo đã đọc > 7 ngày
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const result = await Notification.deleteMany({
          isRead: true,
          readAt: { $lt: weekAgo }
        });

        console.log(`🗑️ Đã xóa ${result.deletedCount} thông báo cũ`);

      } catch (error) {
        console.error('❌ Lỗi dọn dẹp thông báo:', error.message);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Ho_Chi_Minh"
    });

    console.log('⏰ Đã lên lịch dọn dẹp thông báo: 2:00 AM Chủ nhật');
  }
}

module.exports = CronJobs; 