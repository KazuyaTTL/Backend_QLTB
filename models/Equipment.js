const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên thiết bị'],
    trim: true,
    maxlength: [100, 'Tên thiết bị không được vượt quá 100 ký tự']
  },
  code: {
    type: String,
    required: [true, 'Vui lòng nhập mã thiết bị'],
    unique: true,
    uppercase: true,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Vui lòng chọn loại thiết bị'],
    enum: {
      values: ['electronics', 'furniture', 'sports', 'laboratory', 'audio_visual', 'other'],
      message: 'Loại thiết bị không hợp lệ'
    }
  },
  description: {
    type: String,
    maxlength: [500, 'Mô tả không được vượt quá 500 ký tự']
  },
  specifications: {
    type: String,
    maxlength: [1000, 'Thông số kỹ thuật không được vượt quá 1000 ký tự']
  },
  totalQuantity: {
    type: Number,
    required: [true, 'Vui lòng nhập số lượng tổng'],
    min: [0, 'Số lượng không được âm'],
    validate: {
      validator: Number.isInteger,
      message: 'Số lượng phải là số nguyên'
    }
  },
  availableQuantity: {
    type: Number,
    required: true,
    min: [0, 'Số lượng có sẵn không được âm'],
    validate: {
      validator: Number.isInteger,
      message: 'Số lượng phải là số nguyên'
    }
  },
  borrowedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Số lượng đang mượn không được âm'],
    validate: {
      validator: Number.isInteger,
      message: 'Số lượng phải là số nguyên'
    }
  },
  condition: {
    type: String,
    enum: {
      values: ['new', 'good', 'fair', 'poor', 'damaged'],
      message: 'Tình trạng thiết bị không hợp lệ'
    },
    default: 'good'
  },
  location: {
    building: {
      type: String,
      required: [true, 'Vui lòng nhập tòa nhà']
    },
    floor: {
      type: String,
      required: [true, 'Vui lòng nhập tầng']
    },
    room: {
      type: String,
      required: [true, 'Vui lòng nhập phòng']
    }
  },
  images: [{
    url: String,
    alt: String
  }],
  purchaseDate: {
    type: Date
  },
  purchasePrice: {
    type: Number,
    min: [0, 'Giá mua không được âm']
  },
  warrantyExpiry: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  borrowHistory: [{
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BorrowRequest'
    },
    borrowDate: Date,
    returnDate: Date,
    borrower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    quantity: Number
  }],
  maintenanceHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    description: String,
    cost: Number,
    technician: String,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending'
    }
  }],
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
equipmentSchema.index({ name: 'text', description: 'text' });
equipmentSchema.index({ code: 1 });
equipmentSchema.index({ category: 1 });
equipmentSchema.index({ condition: 1 });
equipmentSchema.index({ isActive: 1 });
equipmentSchema.index({ availableQuantity: 1 });

// Validation cho availableQuantity + borrowedQuantity = totalQuantity
equipmentSchema.pre('save', function(next) {
  if (this.availableQuantity + this.borrowedQuantity !== this.totalQuantity) {
    return next(new Error('Tổng số lượng có sẵn và đang mượn phải bằng tổng số lượng'));
  }
  this.updatedAt = Date.now();
  next();
});

// Virtual cho location string
equipmentSchema.virtual('fullLocation').get(function() {
  return `${this.location.building} - Tầng ${this.location.floor} - Phòng ${this.location.room}`;
});

// Method để kiểm tra có thể mượn được không
equipmentSchema.methods.canBorrow = function(quantity) {
  return this.isActive && this.availableQuantity >= quantity;
};

// Method để cập nhật số lượng khi mượn
equipmentSchema.methods.borrowQuantity = function(quantity) {
  if (!this.canBorrow(quantity)) {
    throw new Error('Không đủ số lượng để mượn');
  }
  this.availableQuantity -= quantity;
  this.borrowedQuantity += quantity;
  return this.save();
};

// Method để cập nhật số lượng khi trả
equipmentSchema.methods.returnQuantity = function(quantity) {
  if (this.borrowedQuantity < quantity) {
    throw new Error('Số lượng trả vượt quá số lượng đang mượn');
  }
  this.availableQuantity += quantity;
  this.borrowedQuantity -= quantity;
  return this.save();
};

// Static method để tìm thiết bị có sẵn
equipmentSchema.statics.findAvailable = function() {
  return this.find({ 
    isActive: true, 
    availableQuantity: { $gt: 0 } 
  });
};

module.exports = mongoose.model('Equipment', equipmentSchema); 