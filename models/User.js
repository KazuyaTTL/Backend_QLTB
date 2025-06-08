const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: function() {
      return this.role === 'student';
    },
    unique: true,
    sparse: true
  },
  fullName: {
    type: String,
    required: [true, 'Vui lòng nhập họ tên'],
    trim: true,
    maxlength: [100, 'Họ tên không được vượt quá 100 ký tự']
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Vui lòng nhập email hợp lệ'
    ]
  },
  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  phone: {
    type: String,
    match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ']
  },
  faculty: {
    type: String,
    required: function() {
      return this.role === 'student';
    }
  },
  class: {
    type: String,
    required: function() {
      return this.role === 'student';
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  
  // === BORROW LIMITS & TRACKING ===
  borrowLimit: {
    type: Number,
    default: 3, // Mặc định cho phép mượn tối đa 3 thiết bị
    min: [0, 'Giới hạn mượn không được âm'],
    max: [20, 'Giới hạn mượn không được vượt quá 20']
  },
  currentBorrowCount: {
    type: Number,
    default: 0,
    min: [0, 'Số lượng đang mượn không được âm']
  },
  borrowHistory: [{
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BorrowRequest'
    },
    action: {
      type: String,
      enum: ['borrowed', 'returned', 'overdue']
    },
    date: {
      type: Date,
      default: Date.now
    },
    equipmentCount: Number
  }],
  
  // === RESTRICTIONS & PENALTIES ===
  isRestricted: {
    type: Boolean,
    default: false
  },
  borrowRestrictions: [{
    type: {
      type: String,
      enum: ['overdue_penalty', 'damage_penalty', 'admin_restriction', 'temporary_ban']
    },
    reason: String,
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date, // null = permanent
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // === OVERDUE TRACKING ===
  overdueCount: {
    type: Number,
    default: 0
  },
  lastOverdueDate: Date,
  
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
userSchema.index({ email: 1 });
userSchema.index({ studentId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isRestricted: 1 });
userSchema.index({ currentBorrowCount: 1 });

// Middleware để hash password trước khi lưu
userSchema.pre('save', async function(next) {
  // Chỉ hash password nếu password được thay đổi
  if (!this.isModified('password')) return next();

  try {
    // Hash password với cost 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware để cập nhật updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method để so sánh password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method để cập nhật thời gian login cuối
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = Date.now();
  return this.save();
};

// === BORROW LIMIT METHODS ===

// Kiểm tra có thể mượn thêm không (chỉ tính thiết bị đã được approve)
userSchema.methods.canBorrow = function(quantity = 1) {
  // Kiểm tra có bị hạn chế không
  if (this.isRestricted) {
    return {
      allowed: false,
      reason: 'Tài khoản đang bị hạn chế mượn thiết bị',
      restrictions: this.borrowRestrictions.filter(r => !r.endDate || r.endDate > new Date())
    };
  }

  // Kiểm tra giới hạn số lượng
  if (this.currentBorrowCount + quantity > this.borrowLimit) {
    return {
      allowed: false,
      reason: `Vượt quá giới hạn mượn. Hiện tại: ${this.currentBorrowCount}/${this.borrowLimit}, yêu cầu thêm: ${quantity}`,
      currentCount: this.currentBorrowCount,
      limit: this.borrowLimit
    };
  }

  return {
    allowed: true,
    remaining: this.borrowLimit - this.currentBorrowCount
  };
};

// Kiểm tra có thể tạo request mới không (tính cả pending requests)
userSchema.methods.canCreateRequest = async function(quantity = 1) {
  // Kiểm tra có bị hạn chế không
  if (this.isRestricted) {
    return {
      allowed: false,
      reason: 'Tài khoản đang bị hạn chế mượn thiết bị',
      restrictions: this.borrowRestrictions.filter(r => !r.endDate || r.endDate > new Date())
    };
  }

  // Tính tổng số thiết bị trong các pending requests
  const BorrowRequest = require('./BorrowRequest');
  const pendingRequests = await BorrowRequest.find({
    borrower: this._id,
    status: 'pending'
  });

  const pendingQuantity = pendingRequests.reduce((total, request) => {
    return total + request.equipments.reduce((sum, item) => sum + item.quantity, 0);
  }, 0);

  const totalQuantity = this.currentBorrowCount + pendingQuantity + quantity;

  // Kiểm tra giới hạn tổng
  if (totalQuantity > this.borrowLimit) {
    return {
      allowed: false,
      reason: `Vượt quá giới hạn mượn. Đang mượn: ${this.currentBorrowCount}, Đang chờ duyệt: ${pendingQuantity}, Yêu cầu thêm: ${quantity}, Giới hạn: ${this.borrowLimit}`,
      currentCount: this.currentBorrowCount,
      pendingCount: pendingQuantity,
      requestedCount: quantity,
      limit: this.borrowLimit,
      total: totalQuantity
    };
  }

  return {
    allowed: true,
    currentCount: this.currentBorrowCount,
    pendingCount: pendingQuantity,
    requestedCount: quantity,
    limit: this.borrowLimit,
    total: totalQuantity,
    remaining: this.borrowLimit - totalQuantity
  };
};

// Cập nhật số lượng đang mượn
userSchema.methods.updateBorrowCount = async function(change, requestId = null) {
  this.currentBorrowCount += change;
  
  // Thêm vào lịch sử
  if (requestId) {
    this.borrowHistory.push({
      requestId,
      action: change > 0 ? 'borrowed' : 'returned',
      date: new Date(),
      equipmentCount: Math.abs(change)
    });
  }
  
  return this.save();
};

// Thêm hạn chế mượn
userSchema.methods.addRestriction = async function(type, reason, endDate = null, createdBy = null) {
  this.borrowRestrictions.push({
    type,
    reason,
    endDate,
    createdBy
  });
  this.isRestricted = true;
  return this.save();
};

// Bỏ hạn chế (hết hạn hoặc admin bỏ)
userSchema.methods.removeExpiredRestrictions = async function() {
  const now = new Date();
  this.borrowRestrictions = this.borrowRestrictions.filter(r => {
    return !r.endDate || r.endDate > now;
  });
  
  this.isRestricted = this.borrowRestrictions.length > 0;
  return this.save();
};

// Xử lý vi phạm quá hạn
userSchema.methods.handleOverdue = async function() {
  this.overdueCount += 1;
  this.lastOverdueDate = new Date();
  
  // Áp dụng penalty dựa trên số lần vi phạm
  if (this.overdueCount >= 3) {
    // Cấm mượn 30 ngày
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    await this.addRestriction(
      'overdue_penalty',
      `Vi phạm quá hạn ${this.overdueCount} lần. Tạm cấm mượn 30 ngày.`,
      endDate
    );
  } else if (this.overdueCount >= 2) {
    // Cấm mượn 7 ngày
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    
    await this.addRestriction(
      'overdue_penalty',
      `Vi phạm quá hạn ${this.overdueCount} lần. Tạm cấm mượn 7 ngày.`,
      endDate
    );
  }
  
  return this.save();
};

module.exports = mongoose.model('User', userSchema); 