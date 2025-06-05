const express = require('express');
const router = express.Router();
const {
  getBorrowRequests,
  createBorrowRequest,
  approveBorrowRequest,
  rejectBorrowRequest,
  borrowEquipment,
  returnEquipment,
  getStats
} = require('../controllers/borrowRequestController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

//  Tất cả routes cần authentication
router.use(authenticateToken);

//  GET /api/requests/stats - Thống kê (all users)
router.get('/stats', getStats);

//  GET /api/requests - Lấy danh sách requests (role-based filtering)
router.get('/', getBorrowRequests);

// POST /api/requests - Tạo request mới (students + admin)
router.post('/', createBorrowRequest);

//  Routes chỉ dành cho admin
router.use(requireAdmin);

//  PUT /api/requests/:id/approve - Duyệt request
router.put('/:id/approve', approveBorrowRequest);

//  PUT /api/requests/:id/reject - Từ chối request
router.put('/:id/reject', rejectBorrowRequest);

//  PUT /api/requests/:id/borrow - Cho mượn thiết bị
router.put('/:id/borrow', borrowEquipment);

//  PUT /api/requests/:id/return - Trả thiết bị
router.put('/:id/return', returnEquipment);

module.exports = router;