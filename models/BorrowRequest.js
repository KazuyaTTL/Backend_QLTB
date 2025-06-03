const mongoose = require('mongoose');

const borrowRequestSchema = new mongoose.Schema({
  requestNumber: {
    type: String,
    unique: true,
    required: true
  },
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vui lòng chỉ định người mượn']
  },
  equipments: [{
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: true
    },
    quantity: {
      type: Number,
      required: [true, 'Vui lòng nhập số lượng'],
      min: [1, 'Số lượng phải lớn hơn 0'],
      validate: {
        validator: Number.isInteger,
        message: 'Số lượng phải là số nguyên'
      }
    },
    actualReturnQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng trả thực tế không được âm']
    }
  }],
  borrowDate: {
    type: Date,
    required: [true, 'Vui lòng chọn ngày mượn'],
    validate: {
      validator: function(value) {
        return value >= new Date().setHours(0, 0, 0, 0);
      },
      message: 'Ngày mượn không được trong quá khứ'
    }
  },
  expectedReturnDate: {
    type: Date,
    required: [true, 'Vui lòng chọn ngày trả dự kiến'],
    validate: {
      validator: function(value) {
        return value > this.borrowDate;
      },
      message: 'Ngày trả dự kiến phải sau ngày mượn'
    }
  },
  actualReturnDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value >= this.borrowDate;
      },
      message: 'Ngày trả thực tế không được trước ngày mượn'
    }
  },
  purpose: {
    type: String,
    required: [true, 'Vui lòng nhập mục đích sử dụng'],
    maxlength: [500, 'Mục đích sử dụng không được vượt quá 500 ký tự']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Ghi chú không được vượt quá 1000 ký tự']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected', 'borrowed', 'returned', 'overdue', 'cancelled'],
      message: 'Trạng thái yêu cầu không hợp lệ'
    },
    default: 'pending'
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'normal', 'high', 'urgent'],
      message: 'Mức độ ưu tiên không hợp lệ'
    },
    default: 'normal'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String,
    maxlength: [500, 'Ghi chú duyệt không được vượt quá 500 ký tự']
  },
  rejectionReason: {
    type: String,
    maxlength: [500, 'Lý do từ chối không được vượt quá 500 ký tự']
  },
  borrowedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  borrowedAt: {
    type: Date
  },
  returnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  returnedAt: {
    type: Date
  },
  isOverdue: {
    type: Boolean,
    default: false
  },
  overdueNotificationSent: {
    type: Boolean,
    default: false
  },
  remindersSent: [{
    type: {
      type: String,
      enum: ['before_due', 'overdue']
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    days: Number
  }],
  damages: [{
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment'
    },
    description: String,
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'severe'],
      default: 'minor'
    },
    cost: Number,
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
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
borrowRequestSchema.index({ requestNumber: 1 });
borrowRequestSchema.index({ borrower: 1 });
borrowRequestSchema.index({ status: 1 });
borrowRequestSchema.index({ borrowDate: 1 });
borrowRequestSchema.index({ expectedReturnDate: 1 });
borrowRequestSchema.index({ isOverdue: 1 });
borrowRequestSchema.index({ createdAt: -1 });

// Compound index
borrowRequestSchema.index({ status: 1, borrowDate: 1 });
borrowRequestSchema.index({ borrower: 1, status: 1 });

// Auto-generate request number
borrowRequestSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    this.requestNumber = `BR${year}${month}${(count + 1).toString().padStart(4, '0')}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Virtual để tính số ngày mượn
borrowRequestSchema.virtual('borrowDuration').get(function() {
  const endDate = this.actualReturnDate || this.expectedReturnDate;
  const startDate = this.borrowDate;
  return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
});

// Virtual để kiểm tra đã quá hạn chưa
borrowRequestSchema.virtual('isCurrentlyOverdue').get(function() {
  if (this.status === 'returned' || this.status === 'cancelled') {
    return false;
  }
  return new Date() > this.expectedReturnDate;
});

// Virtual để tính tổng số thiết bị
borrowRequestSchema.virtual('totalEquipments').get(function() {
  return this.equipments.reduce((total, item) => total + item.quantity, 0);
});

// Method để approve request
borrowRequestSchema.methods.approve = function(reviewerId, notes) {
  this.status = 'approved';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.reviewNotes = notes;
  return this.save();
};

// Method để reject request
borrowRequestSchema.methods.reject = function(reviewerId, reason) {
  this.status = 'rejected';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

// Method để mark as borrowed
borrowRequestSchema.methods.markAsBorrowed = function(adminId) {
  this.status = 'borrowed';
  this.borrowedBy = adminId;
  this.borrowedAt = new Date();
  return this.save();
};

// Method để mark as returned
borrowRequestSchema.methods.markAsReturned = function(adminId) {
  this.status = 'returned';
  this.returnedBy = adminId;
  this.returnedAt = new Date();
  this.actualReturnDate = new Date();
  return this.save();
};

// Method để update overdue status
borrowRequestSchema.methods.updateOverdueStatus = function() {
  if (this.isCurrentlyOverdue && this.status === 'borrowed') {
    this.isOverdue = true;
    this.status = 'overdue';
  }
  return this.save();
};

// Static method để tìm requests quá hạn
borrowRequestSchema.statics.findOverdue = function() {
  const today = new Date();
  return this.find({
    status: 'borrowed',
    expectedReturnDate: { $lt: today }
  });
};

// Static method để tìm requests sắp đến hạn
borrowRequestSchema.statics.findDueSoon = function(days = 3) {
  const today = new Date();
  const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return this.find({
    status: 'borrowed',
    expectedReturnDate: { 
      $gte: today,
      $lte: futureDate 
    }
  });
};

module.exports = mongoose.model('BorrowRequest', borrowRequestSchema); 