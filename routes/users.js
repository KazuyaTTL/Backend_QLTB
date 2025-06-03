const express = require('express');
const router = express.Router();

// Import middleware
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/users
 * @desc    Lấy danh sách users (chỉ admin)
 * @access  Private (Admin)
 */
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    status: 'success',
    message: 'Users endpoint - Coming soon'
  });
});

module.exports = router; 