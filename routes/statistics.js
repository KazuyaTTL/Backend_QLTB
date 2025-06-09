const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Protect tất cả routes
router.use(authenticateToken);

// Routes cho thống kê (admin và user đều có thể xem)
router.get('/most-borrowed', statisticsController.getMostBorrowedEquipment);
router.get('/monthly-overview', statisticsController.getMonthlyOverview);
router.get('/current', statisticsController.getCurrentStatistics);
router.get('/compare', statisticsController.compareMonthlyStatistics);

// Route gửi cảnh báo thủ công (chỉ admin)
router.post('/send-warnings', requireAdmin, statisticsController.sendDueDateWarnings);

module.exports = router; 