const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');

// Lấy danh sách thông báo của user
exports.getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, isRead } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { recipient: req.user._id };
    
    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead === 'true';

    // Lấy thông báo với pagination
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('relatedRequest', 'requestNumber status')
        .populate('relatedEquipment', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      
      Notification.countDocuments(query),
      
      Notification.getUnreadCount(req.user._id)
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        notifications: notifications.map(notification => ({
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          isRead: notification.isRead,
          isNew: notification.isNew,
          timeAgo: notification.timeAgo,
          relatedRequest: notification.relatedRequest,
          relatedEquipment: notification.relatedEquipment,
          data: notification.data,
          createdAt: notification.createdAt
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        },
        unreadCount: unreadCount
      }
    });

  } catch (error) {
    console.error('Lỗi lấy thông báo:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi lấy thông báo'
    });
  }
};

// Đánh dấu thông báo đã đọc
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy thông báo'
      });
    }

    await notification.markAsRead();

    res.status(200).json({
      status: 'success',
      message: 'Đã đánh dấu thông báo đã đọc',
      data: {
        notificationId: notification._id,
        isRead: notification.isRead,
        readAt: notification.readAt
      }
    });

  } catch (error) {
    console.error('Lỗi đánh dấu đã đọc:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi đánh dấu đã đọc'
    });
  }
};

// Đánh dấu tất cả thông báo đã đọc
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.user._id);

    res.status(200).json({
      status: 'success',
      message: `Đã đánh dấu ${result.modifiedCount} thông báo đã đọc`,
      data: {
        updatedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Lỗi đánh dấu tất cả đã đọc:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi đánh dấu tất cả đã đọc'
    });
  }
};

// Lấy số lượng thông báo chưa đọc
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.status(200).json({
      status: 'success',
      data: {
        unreadCount: unreadCount
      }
    });

  } catch (error) {
    console.error('Lỗi lấy số thông báo chưa đọc:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi lấy số thông báo chưa đọc'
    });
  }
};

// Xóa thông báo
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy thông báo để xóa'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Đã xóa thông báo thành công'
    });

  } catch (error) {
    console.error('Lỗi xóa thông báo:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi xóa thông báo'
    });
  }
};

// [ADMIN] Tạo thông báo chung
exports.createGeneralNotification = async (req, res) => {
  try {
    const { title, message, priority = 'normal' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng nhập tiêu đề và nội dung thông báo'
      });
    }

    const notifications = await notificationService.createGeneralNotification(
      title, 
      message, 
      priority
    );

    res.status(201).json({
      status: 'success',
      message: `Đã gửi thông báo đến ${notifications.length} sinh viên`,
      data: {
        notificationCount: notifications.length,
        title: title,
        priority: priority
      }
    });

  } catch (error) {
    console.error('Lỗi tạo thông báo chung:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi tạo thông báo chung'
    });
  }
};

// [ADMIN] Trigger tạo thông báo nhắc nhở
exports.triggerReminders = async (req, res) => {
  try {
    const [reminderResult, overdueResult] = await Promise.all([
      notificationService.checkAndCreateDueDateReminders(),
      notificationService.checkAndCreateOverdueNotifications()
    ]);

    res.status(200).json({
      status: 'success',
      message: 'Đã kiểm tra và tạo thông báo',
      data: {
        reminderNotifications: reminderResult.count || 0,
        overdueNotifications: overdueResult.count || 0,
        total: (reminderResult.count || 0) + (overdueResult.count || 0)
      }
    });

  } catch (error) {
    console.error('Lỗi trigger thông báo:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi tạo thông báo'
    });
  }
};

// [ADMIN] Lấy thống kê thông báo
exports.getNotificationStats = async (req, res) => {
  try {
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unreadCount: { 
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalStats = await Notification.aggregate([
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          totalUnread: { 
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          },
          todayNotifications: {
            $sum: {
              $cond: [
                {
                  $gte: ['$createdAt', new Date(new Date().setHours(0, 0, 0, 0))]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        byType: stats,
        overall: totalStats[0] || {
          totalNotifications: 0,
          totalUnread: 0,
          todayNotifications: 0
        }
      }
    });

  } catch (error) {
    console.error('Lỗi lấy thống kê thông báo:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi lấy thống kê thông báo'
    });
  }
}; 