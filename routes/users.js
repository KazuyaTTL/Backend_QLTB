const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllUsers,
  updateUserBorrowLimit,
  addUserRestriction,
  removeUserRestriction,
  getUserDetails
} = require('../controllers/authController');

// Import middleware
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Tất cả routes này chỉ dành cho admin
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @route   GET /api/users
 * @desc    Lấy danh sách tất cả users (Admin only)
 * @access  Admin only
 * @query   { page, limit, role, isRestricted, search }
 */
router.get('/', getAllUsers);

/**
 * @route   GET /api/users/:userId
 * @desc    Lấy chi tiết user với history (Admin only)
 * @access  Admin only
 */
router.get('/:userId', getUserDetails);

/**
 * @route   PUT /api/users/:userId/borrow-limit
 * @desc    Cập nhật giới hạn mượn của user (Admin only)
 * @access  Admin only
 * @body    { borrowLimit, reason }
 */
router.put('/:userId/borrow-limit', updateUserBorrowLimit);

/**
 * @route   POST /api/users/:userId/restrictions
 * @desc    Thêm hạn chế cho user (Admin only)
 * @access  Admin only
 * @body    { type, reason, duration }
 */
router.post('/:userId/restrictions', addUserRestriction);

/**
 * @route   DELETE /api/users/:userId/restrictions
 * @desc    Bỏ tất cả hạn chế của user (Admin only)
 * @access  Admin only
 * @body    { reason }
 */
router.delete('/:userId/restrictions', removeUserRestriction);

module.exports = router; 