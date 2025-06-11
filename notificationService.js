const Notification = require('../models/Notification');
const BorrowRequest = require('../models/BorrowRequest');

class NotificationService {
  // Tạo thông báo khi request được chấp nhận
  async createRequestApprovedNotification(borrowRequest) {
    try {
      const equipment = await require('../models/Equipment').findById(
        borrowRequest.equipments[0].equipment
      );

      return await Notification.createNotification({
        recipient: borrowRequest.borrower,
        title: '✅ Yêu cầu mượn được chấp nhận',
        message: `Yêu cầu mượn "${equipment.name}" của bạn đã được chấp nhận. Vui lòng đến nhận thiết bị theo thời gian đã hẹn.`,
        type: 'request_approved',
        priority: 'high',
        relatedRequest: borrowRequest._id,
        relatedEquipment: equipment._id,
        data: {
          equipmentName: equipment.name,
          borrowDate: borrowRequest.borrowDate,
          expectedReturnDate: borrowRequest.expectedReturnDate
        }
      });
    } catch (error) {
      console.error('Lỗi tạo thông báo chấp nhận:', error.message);
    }
  }

  // Tạo thông báo khi request bị từ chối
  async createRequestRejectedNotification(borrowRequest, reason) {
    try {
      const equipment = await require('../models/Equipment').findById(
        borrowRequest.equipments[0].equipment
      );

      return await Notification.createNotification({
        recipient: borrowRequest.borrower,
        title: '❌ Yêu cầu mượn bị từ chối',
        message: `Yêu cầu mượn "${equipment.name}" của bạn đã bị từ chối. Lý do: ${reason}`,
        type: 'request_rejected',
        priority: 'normal',
        relatedRequest: borrowRequest._id,
        relatedEquipment: equipment._id,
        data: {
          equipmentName: equipment.name,
          rejectionReason: reason
        }
      });
    } catch (error) {
      console.error('Lỗi tạo thông báo từ chối:', error.message);
    }
  }

  // Tạo thông báo khi mượn thành công
  async createBorrowSuccessNotification(borrowRequest) {
    try {
      const equipment = await require('../models/Equipment').findById(
        borrowRequest.equipments[0].equipment
      );

      return await Notification.createNotification({
        recipient: borrowRequest.borrower,
        title: '📦 Đã nhận thiết bị thành công',
        message: `Bạn đã nhận "${equipment.name}" thành công. Vui lòng trả đúng hạn vào ngày ${new Date(borrowRequest.expectedReturnDate).toLocaleDateString('vi-VN')}.`,
        type: 'borrow_success',
        priority: 'normal',
        relatedRequest: borrowRequest._id,
        relatedEquipment: equipment._id,
        data: {
          equipmentName: equipment.name,
          dueDate: borrowRequest.expectedReturnDate
        }
      });
    } catch (error) {
      console.error('Lỗi tạo thông báo mượn thành công:', error.message);
    }
  }

  // Tạo thông báo nhắc nhở trả thiết bị
  async createReturnReminderNotification(borrowRequest, daysLeft) {
    try {
      const equipment = await require('../models/Equipment').findById(
        borrowRequest.equipments[0].equipment
      );

      const urgency = daysLeft <= 1 ? 'urgent' : 'high';
      const icon = daysLeft <= 1 ? '🚨' : '⏰';
      const title = daysLeft <= 1 ? 
        `${icon} KHẨN CẤP: Sắp quá hạn trả thiết bị` : 
        `${icon} Nhắc nhở: Sắp đến hạn trả thiết bị`;

      return await Notification.createNotification({
        recipient: borrowRequest.borrower,
        title: title,
        message: `Thiết bị "${equipment.name}" sẽ hết hạn trong ${daysLeft} ngày (${new Date(borrowRequest.expectedReturnDate).toLocaleDateString('vi-VN')}). Vui lòng chuẩn bị trả đúng hạn.`,
        type: 'return_reminder',
        priority: urgency,
        relatedRequest: borrowRequest._id,
        relatedEquipment: equipment._id,
        data: {
          equipmentName: equipment.name,
          daysLeft: daysLeft,
          dueDate: borrowRequest.expectedReturnDate
        }
      });
    } catch (error) {
      console.error('Lỗi tạo thông báo nhắc nhở:', error.message);
    }
  }

  // Tạo thông báo quá hạn
  async createOverdueNotification(borrowRequest, daysOverdue) {
    try {
      const equipment = await require('../models/Equipment').findById(
        borrowRequest.equipments[0].equipment
      );

      return await Notification.createNotification({
        recipient: borrowRequest.borrower,
        title: '🚨 THIẾT BỊ ĐÃ QUÁ HẠN',
        message: `Thiết bị "${equipment.name}" đã quá hạn ${daysOverdue} ngày (hạn trả: ${new Date(borrowRequest.expectedReturnDate).toLocaleDateString('vi-VN')}). Vui lòng trả ngay lập tức để tránh bị xử lý kỷ luật.`,
        type: 'return_overdue',
        priority: 'urgent',
        relatedRequest: borrowRequest._id,
        relatedEquipment: equipment._id,
        data: {
          equipmentName: equipment.name,
          daysOverdue: daysOverdue,
          dueDate: borrowRequest.expectedReturnDate
        }
      });
    } catch (error) {
      console.error('Lỗi tạo thông báo quá hạn:', error.message);
    }
  }

  // Tạo thông báo trả thành công
  async createReturnSuccessNotification(borrowRequest) {
    try {
      const equipment = await require('../models/Equipment').findById(
        borrowRequest.equipments[0].equipment
      );

      return await Notification.createNotification({
        recipient: borrowRequest.borrower,
        title: '✅ Đã trả thiết bị thành công',
        message: `Bạn đã trả "${equipment.name}" thành công. Cảm ơn bạn đã sử dụng thiết bị đúng quy định.`,
        type: 'return_success',
        priority: 'normal',
        relatedRequest: borrowRequest._id,
        relatedEquipment: equipment._id,
        data: {
          equipmentName: equipment.name,
          returnDate: new Date()
        }
      });
    } catch (error) {
      console.error('Lỗi tạo thông báo trả thành công:', error.message);
    }
  }

  // Kiểm tra và tạo thông báo cho thiết bị sắp hết hạn
  async checkAndCreateDueDateReminders() {
    try {
      const now = new Date();
      const threeDaysLater = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
      const oneDayLater = new Date(now.getTime() + (24 * 60 * 60 * 1000));

      // Tìm các request sắp hết hạn
      const dueSoonRequests = await BorrowRequest.find({
        status: 'borrowed',
        expectedReturnDate: {
          $gte: now,
          $lte: threeDaysLater
        }
      }).populate('borrower', 'name email');

      let notificationCount = 0;

      for (const request of dueSoonRequests) {
        const daysLeft = Math.ceil((request.expectedReturnDate - now) / (24 * 60 * 60 * 1000));
        
        // Chỉ gửi thông báo cho 1 và 3 ngày
        if (daysLeft === 1 || daysLeft === 3) {
          // Kiểm tra đã gửi thông báo chưa
          const existingNotification = await Notification.findOne({
            recipient: request.borrower._id,
            relatedRequest: request._id,
            type: 'return_reminder',
            createdAt: {
              $gte: new Date(now.getTime() - (24 * 60 * 60 * 1000)) // Trong 24h qua
            }
          });

          if (!existingNotification) {
            await this.createReturnReminderNotification(request, daysLeft);
            notificationCount++;
          }
        }
      }

      console.log(`📱 Đã tạo ${notificationCount} thông báo nhắc nhở`);
      return { success: true, count: notificationCount };

    } catch (error) {
      console.error('Lỗi kiểm tra thông báo nhắc nhở:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Kiểm tra và tạo thông báo quá hạn
  async checkAndCreateOverdueNotifications() {
    try {
      const now = new Date();

      // Tìm các request đã quá hạn
      const overdueRequests = await BorrowRequest.find({
        status: 'borrowed',
        expectedReturnDate: { $lt: now }
      }).populate('borrower', 'name email');

      let notificationCount = 0;

      for (const request of overdueRequests) {
        const daysOverdue = Math.ceil((now - request.expectedReturnDate) / (24 * 60 * 60 * 1000));
        
        // Kiểm tra đã gửi thông báo quá hạn chưa
        const existingNotification = await Notification.findOne({
          recipient: request.borrower._id,
          relatedRequest: request._id,
          type: 'return_overdue',
          createdAt: {
            $gte: new Date(now.getTime() - (24 * 60 * 60 * 1000)) // Trong 24h qua
          }
        });

        if (!existingNotification) {
          await this.createOverdueNotification(request, daysOverdue);
          notificationCount++;
        }
      }

      console.log(`📱 Đã tạo ${notificationCount} thông báo quá hạn`);
      return { success: true, count: notificationCount };

    } catch (error) {
      console.error('Lỗi kiểm tra thông báo quá hạn:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Tạo thông báo chung cho tất cả users
  async createGeneralNotification(title, message, priority = 'normal') {
    try {
      const User = require('../models/User');
      const users = await User.find({ role: 'student' });

      const notifications = users.map(user => ({
        recipient: user._id,
        title: title,
        message: message,
        type: 'general',
        priority: priority
      }));

      const result = await Notification.insertMany(notifications);
      console.log(`📢 Đã tạo ${result.length} thông báo chung`);
      return result;

    } catch (error) {
      console.error('Lỗi tạo thông báo chung:', error.message);
    }
  }
}

module.exports = new NotificationService(); 