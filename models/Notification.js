const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vui lòng chỉ định người nhận thông báo']
  },
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tiêu đề thông báo'],
    maxlength: [200, 'Tiêu đề không được vượt quá 200 ký tự']
  },
  message: {
    type: String,
    required: [true, 'Vui lòng nhập nội dung thông báo'],
    maxlength: [1000, 'Nội dung không được vượt quá 1000 ký tự']
  },
  type: {
    type: String,
    enum: {
      values: [
        'request_approved',     // Yêu cầu được chấp nhận
        'request_rejected',     // Yêu cầu bị từ chối
        'borrow_success',       // Mượn thành công
        'return_reminder',      // Nhắc nhở trả
        'return_overdue',       // Quá hạn trả
        'return_success',       // Trả thành công
        'equipment_available',  // Thiết bị có sẵn
        'system_maintenance',   // Bảo trì hệ thống
        'general'              // Thông báo chung
      ],
      message: 'Loại thông báo không hợp lệ'
    },
    required: true
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'normal', 'high', 'urgent'],
      message: 'Mức độ ưu tiên không hợp lệ'
    },
    default: 'normal'
  },
  relatedRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BorrowRequest'
  },
  relatedEquipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Dữ liệu bổ sung (JSON)
    default: {}
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Thông báo tự xóa sau 30 ngày
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index để tối ưu tìm kiếm
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto delete

// Compound index
notificationSchema.index({ recipient: 1, type: 1, isRead: 1 });

// Virtual để tính thời gian từ khi tạo
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffMs = now - this.createdAt;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  
  return this.createdAt.toLocaleDateString('vi-VN');
});

// Virtual để kiểm tra thông báo mới
notificationSchema.virtual('isNew').get(function() {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return this.createdAt > hourAgo && !this.isRead;
});

// Method để đánh dấu đã đọc
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  this.updatedAt = new Date();
  return this.save();
};

// Static method để tạo thông báo
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  return notification;
};

// Static method để lấy thông báo chưa đọc
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false
  });
};

// Static method để đánh dấu tất cả đã đọc
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { 
      isRead: true, 
      readAt: new Date(),
      updatedAt: new Date()
    }
  );
};

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Notification', notificationSchema); 