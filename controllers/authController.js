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

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logout,
  createAdminAccount
}; 