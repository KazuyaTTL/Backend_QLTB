const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const User = require('../models/User');

// Middleware xác thực JWT
const authenticateToken = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Không tìm thấy token xác thực'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Tìm user trong database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Token không hợp lệ - người dùng không tồn tại'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token không hợp lệ'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token đã hết hạn'
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi xác thực'
    });
  }
};

// Middleware kiểm tra quyền admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      status: 'error',
      message: 'Chỉ admin mới có quyền thực hiện hành động này'
    });
  }
};

// Middleware kiểm tra quyền student
const requireStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    return res.status(403).json({
      status: 'error',
      message: 'Chỉ sinh viên mới có quyền thực hiện hành động này'
    });
  }
};

// Middleware kiểm tra quyền admin hoặc chính chủ
const requireAdminOrOwner = (req, res, next) => {
  const userId = req.params.userId || req.params.id;
  
  if (req.user && (req.user.role === 'admin' || req.user._id.toString() === userId)) {
    next();
  } else {
    return res.status(403).json({
      status: 'error',
      message: 'Bạn không có quyền thực hiện hành động này'
    });
  }
};

// Middleware optional auth (không bắt buộc đăng nhập)
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req);
    
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireStudent,
  requireAdminOrOwner,
  optionalAuth
}; 