const express = require('express');
const router = express.Router();

// Import controllers
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logout
} = require('../controllers/authController');

// Import middleware
const { authenticateToken } = require('../middleware/auth');

// Import validation
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword
} = require('../middleware/validation');

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký tài khoản mới
 * @access  Public
 * @body    { fullName, email, password, studentId?, phone?, faculty?, class?, role? }
 */
router.post('/register', validateRegister, register);

/**
 * @route   POST /api/auth/login
 * @desc    Đăng nhập
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', validateLogin, login);

/**
 * @route   GET /api/auth/profile
 * @desc    Lấy thông tin profile của user hiện tại
 * @access  Private
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Cập nhật profile
 * @access  Private
 * @body    { fullName?, phone?, faculty?, class? }
 */
router.put('/profile', authenticateToken, validateUpdateProfile, updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Đổi mật khẩu
 * @access  Private
 * @body    { currentPassword, newPassword, confirmPassword }
 */
router.put('/change-password', authenticateToken, validateChangePassword, changePassword);

/**
 * @route   POST /api/auth/refresh
 * @desc    Gia hạn token
 * @access  Private
 */
router.post('/refresh', authenticateToken, refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Đăng xuất (chỉ thông báo thành công)
 * @access  Private
 */
router.post('/logout', authenticateToken, logout);

module.exports = router; 