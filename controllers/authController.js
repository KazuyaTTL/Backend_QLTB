const User = require('../models/User');
const { generateTokenForUser } = require('../utils/jwt');

// Đăng ký tài khoản
const register = async (req, res) => {
  try {
    const { fullName, email, password, studentId, phone, faculty, class: className } = req.body;

    // CHỈ CHO PHÉP ĐĂNG KÝ TÀI KHOẢN SINH VIÊN
    const role = 'student';

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email đã được sử dụng'
      });
    }

    // Kiểm tra studentId đã tồn tại (nếu có studentId)
    if (studentId) {
      const existingStudent = await User.findOne({ studentId });
      if (existingStudent) {
        return res.status(400).json({
          status: 'error',
          message: 'Mã sinh viên đã được sử dụng'
        });
      }
    }

    // Tạo user mới (chỉ sinh viên)
    const userData = {
      fullName,
      email,
      password,
      role: 'student'
    };

    // Thêm thông tin sinh viên nếu có
    if (studentId) userData.studentId = studentId;
    if (phone) userData.phone = phone;
    if (faculty) userData.faculty = faculty;
    if (className) userData.class = className;

    const user = await User.create(userData);

    // Generate token
    const token = generateTokenForUser(user);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      status: 'success',
      message: 'Đăng ký thành công',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi đăng ký'
    });
  }
};

// Đăng nhập
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔍 DEBUG LOGS
    console.log('🚀 === LOGIN DEBUG ===');
    console.log('📧 Email nhận được:', email);
    console.log('🔑 Password nhận được:', password);
    console.log('📦 Full body:', JSON.stringify(req.body, null, 2));
    console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));

    // Tìm user và include password để so sánh
    const user = await User.findOne({ email }).select('+password');
    
    console.log('👤 User tìm được:', user ? `${user.email} (${user._id})` : 'null');
    
    if (!user) {
      console.log('❌ Không tìm thấy user với email:', email);
      return res.status(401).json({
        status: 'error',
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Kiểm tra tài khoản có hoạt động không
    if (!user.isActive) {
      console.log('❌ Tài khoản bị vô hiệu hóa');
      return res.status(401).json({
        status: 'error',
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    // Kiểm tra mật khẩu
    console.log('🔐 Bắt đầu kiểm tra password...');
    const isPasswordMatch = await user.matchPassword(password);
    console.log('🔐 Kết quả so sánh password:', isPasswordMatch);
    
    if (!isPasswordMatch) {
      console.log('❌ Mật khẩu không khớp');
      return res.status(401).json({
        status: 'error',
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    console.log('✅ Đăng nhập thành công!');

    // Cập nhật thời gian đăng nhập cuối
    await user.updateLastLogin();

    // Generate token
    const token = generateTokenForUser(user);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      status: 'success',
      message: 'Đăng nhập thành công',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi đăng nhập'
    });
  }
};

// Lấy thông tin profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    res.json({
      status: 'success',
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi lấy thông tin profile'
    });
  }
};

// Cập nhật profile
const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, faculty, class: className } = req.body;
    
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    
    // Chỉ cho phép sinh viên cập nhật faculty và class
    if (req.user.role === 'student') {
      if (faculty !== undefined) updateData.faculty = faculty;
      if (className !== undefined) updateData.class = className;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      status: 'success',
      message: 'Cập nhật profile thành công',
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi cập nhật profile'
    });
  }
};

// Đổi mật khẩu
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Tìm user với password
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra mật khẩu hiện tại
    const isCurrentPasswordValid = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Mật khẩu hiện tại không đúng'
      });
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;
    await user.save();

    res.json({
      status: 'success',
      message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi đổi mật khẩu'
    });
  }
};

// Refresh token (gia hạn token)
const refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Tài khoản không hợp lệ'
      });
    }

    // Generate new token
    const token = generateTokenForUser(user);

    res.json({
      status: 'success',
      message: 'Token đã được gia hạn',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi gia hạn token'
    });
  }
};

// Đăng xuất (client-side chỉ cần xóa token)
const logout = (req, res) => {
  res.json({
    status: 'success',
    message: 'Đăng xuất thành công'
  });
};

// Tạo tài khoản Admin (chỉ Admin hiện tại mới được phép)
const createAdminAccount = async (req, res) => {
  try {
    // Kiểm tra người gọi API phải là admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Chỉ Admin mới có quyền tạo tài khoản Admin'
      });
    }

    const { fullName, email, password } = req.body;

    // Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng nhập đầy đủ thông tin: Họ tên, Email, Mật khẩu'
      });
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email đã được sử dụng'
      });
    }

    // Tạo admin mới
    const adminData = {
      fullName,
      email,
      password,
      role: 'admin'
    };

    const newAdmin = await User.create(adminData);

    // Remove password from response
    const adminResponse = newAdmin.toObject();
    delete adminResponse.password;

    res.status(201).json({
      status: 'success',
      message: 'Tạo tài khoản Admin thành công',
      data: {
        admin: adminResponse,
        createdBy: req.user.fullName
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi tạo tài khoản Admin'
    });
  }
};

// === USER MANAGEMENT FOR ADMIN ===

// Lấy danh sách tất cả users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, isRestricted, search } = req.query;
    
    // Build filter
    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (isRestricted !== undefined) filter.isRestricted = isRestricted === 'true';
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      status: 'success',
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy danh sách người dùng'
    });
  }
};

// Cập nhật borrow limit của user (Admin only)
const updateUserBorrowLimit = async (req, res) => {
  try {
    const { userId } = req.params;
    const { borrowLimit, reason } = req.body;

    if (!borrowLimit || borrowLimit < 0 || borrowLimit > 20) {
      return res.status(400).json({
        status: 'error',
        message: 'Giới hạn mượn phải từ 0-20'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy người dùng'
      });
    }

    const oldLimit = user.borrowLimit;
    user.borrowLimit = borrowLimit;
    
    // Thêm vào history
    user.borrowHistory.push({
      action: 'limit_updated',
      date: new Date(),
      equipmentCount: 0,
      notes: `Giới hạn thay đổi từ ${oldLimit} → ${borrowLimit}. Lý do: ${reason || 'Không có'}`
    });

    await user.save();

    res.json({
      status: 'success',
      message: 'Cập nhật giới hạn mượn thành công',
      data: {
        userId: user._id,
        oldLimit,
        newLimit: borrowLimit,
        currentBorrowCount: user.currentBorrowCount,
        updatedBy: req.user.fullName
      }
    });
  } catch (error) {
    console.error('Update borrow limit error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi cập nhật giới hạn mượn'
    });
  }
};

// Thêm restriction cho user (Admin only)
const addUserRestriction = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, reason, duration } = req.body;

    if (!type || !reason) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng nhập đầy đủ loại hạn chế và lý do'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy người dùng'
      });
    }

    let endDate = null;
    if (duration) {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(duration));
    }

    await user.addRestriction(type, reason, endDate, req.user.id);

    res.json({
      status: 'success',
      message: 'Thêm hạn chế thành công',
      data: {
        userId: user._id,
        restriction: {
          type,
          reason,
          endDate,
          duration: duration ? `${duration} ngày` : 'Vĩnh viễn'
        },
        addedBy: req.user.fullName
      }
    });
  } catch (error) {
    console.error('Add restriction error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi thêm hạn chế'
    });
  }
};

// Bỏ restriction cho user (Admin only)
const removeUserRestriction = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy người dùng'
      });
    }

    user.borrowRestrictions = [];
    user.isRestricted = false;
    
    // Thêm vào history
    user.borrowHistory.push({
      action: 'restriction_removed',
      date: new Date(),
      equipmentCount: 0,
      notes: `Bỏ hạn chế. Lý do: ${reason || 'Admin bỏ hạn chế'}`
    });

    await user.save();

    res.json({
      status: 'success',
      message: 'Bỏ hạn chế thành công',
      data: {
        userId: user._id,
        removedBy: req.user.fullName,
        reason: reason || 'Admin bỏ hạn chế'
      }
    });
  } catch (error) {
    console.error('Remove restriction error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi bỏ hạn chế'
    });
  }
};

// Lấy chi tiết user với history (Admin only)
const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password')
      .populate('borrowHistory.requestId', 'requestNumber status');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy người dùng'
      });
    }

    // Lấy current active requests
    const BorrowRequest = require('../models/BorrowRequest');
    const activeRequests = await BorrowRequest.find({
      borrower: userId,
      status: { $in: ['pending', 'approved', 'borrowed'] }
    }).populate('equipments.equipment', 'name code');

    res.json({
      status: 'success',
      data: {
        user,
        activeRequests,
        summary: {
          totalBorrowHistory: user.borrowHistory.length,
          currentlyBorrowing: user.currentBorrowCount,
          borrowLimit: user.borrowLimit,
          overdueCount: user.overdueCount,
          isRestricted: user.isRestricted,
          activeRestrictions: user.borrowRestrictions.filter(r => !r.endDate || r.endDate > new Date())
        }
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy thông tin người dùng'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logout,
  createAdminAccount,
  // User Management
  getAllUsers,
  updateUserBorrowLimit,
  addUserRestriction,
  removeUserRestriction,
  getUserDetails
}; 