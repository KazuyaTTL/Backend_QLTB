const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Protect tất cả routes
router.use(authenticateToken);

// Routes cho sinh viên và admin
router.get('/', notificationController.getMyNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:notificationId/read', notificationController.markAsRead);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);

// Routes chỉ dành cho admin
router.use(requireAdmin);
router.post('/general', notificationController.createGeneralNotification);
router.post('/trigger-reminders', notificationController.triggerReminders);
router.get('/stats', notificationController.getNotificationStats);

module.exports = router; 