const express = require('express');
const router = express.Router();
const {
  getBorrowRequests,
  createBorrowRequest,
  approveBorrowRequest,
  rejectBorrowRequest,
  borrowEquipment,
  returnEquipment,
  getStats,
  getUserPendingOverview
} = require('../controllers/borrowRequestController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

//  Tất cả routes cần authentication
router.use(authenticateToken);

// Debug middleware để log tất cả requests
router.use((req, res, next) => {
  console.log(`🔍 Route Debug: ${req.method} ${req.path} - Original URL: ${req.originalUrl}`);
  console.log(`🔍 Params:`, req.params);
  next();
});

//  GET /api/requests/stats - Thống kê (all users)
router.get('/stats', getStats);

//  GET /api/requests - Lấy danh sách requests (role-based filtering)
router.get('/', getBorrowRequests);

// POST /api/requests - Tạo request mới (students + admin)
router.post('/', createBorrowRequest);

//  Routes chỉ dành cho admin
router.use(requireAdmin);

//  ==== ROUTES CỤ THỂ PHẢI ĐẶT TRƯỚC ROUTES TỔNG QUÁT ====
//  GET /api/requests/pending-overview/:userId - Xem tổng quan pending requests của user
router.get('/pending-overview/:userId', (req, res, next) => {
  console.log('🎯 Hit getUserPendingOverview route!', req.params);
  getUserPendingOverview(req, res, next);
});

//  ==== ROUTES TỔNG QUÁT VỚI :id ====
//  PUT /api/requests/:id/approve - Duyệt request
router.put('/:id/approve', approveBorrowRequest);

//  PUT /api/requests/:id/reject - Từ chối request
router.put('/:id/reject', rejectBorrowRequest);

//  PUT /api/requests/:id/borrow - Cho mượn thiết bị
router.put('/:id/borrow', borrowEquipment);

//  PUT /api/requests/:id/return - Trả thiết bị
router.put('/:id/return', returnEquipment);

module.exports = router;