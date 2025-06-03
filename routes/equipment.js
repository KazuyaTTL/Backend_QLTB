const express = require('express');
const router = express.Router();

// Import controllers
const {
  getEquipments,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getAvailableEquipments,
  getEquipmentStats
} = require('../controllers/equipmentController');

// Import middleware
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// Import validation
const {
  validateEquipment,
  validateEquipmentUpdate,
  validateObjectId,
  validateEquipmentSearch
} = require('../middleware/validation');

/**
 * @route   GET /api/equipment
 * @desc    Lấy danh sách thiết bị (có phân trang và tìm kiếm)
 * @access  Public
 * @query   page, limit, keyword, category, condition, available, building, sortBy, sortOrder
 */
router.get('/', validateEquipmentSearch, getEquipments);

/**
 * @route   GET /api/equipment/available
 * @desc    Lấy danh sách thiết bị có sẵn để mượn
 * @access  Public  
 * @query   page, limit, keyword, category, sortBy, sortOrder
 */
router.get('/available', validateEquipmentSearch, getAvailableEquipments);

/**
 * @route   GET /api/equipment/stats
 * @desc    Lấy thống kê thiết bị (chỉ admin)
 * @access  Private (Admin)
 */
router.get('/stats', authenticateToken, requireAdmin, getEquipmentStats);

/**
 * @route   GET /api/equipment/:id
 * @desc    Lấy thiết bị theo ID
 * @access  Public
 */
router.get('/:id', validateObjectId('id'), getEquipmentById);

/**
 * @route   POST /api/equipment
 * @desc    Tạo thiết bị mới
 * @access  Private (Admin)
 * @body    { name, code, category, description?, specifications?, totalQuantity, availableQuantity?, location, condition?, purchaseDate?, purchasePrice?, warrantyExpiry?, images?, notes? }
 */
router.post('/', authenticateToken, requireAdmin, validateEquipment, createEquipment);

/**
 * @route   PUT /api/equipment/:id
 * @desc    Cập nhật thiết bị (chỉ cần gửi các trường muốn thay đổi)
 * @access  Private (Admin)
 * @body    { name?, code?, category?, description?, specifications?, totalQuantity?, availableQuantity?, location?, condition?, purchaseDate?, purchasePrice?, warrantyExpiry?, images?, notes? }
 */
router.put('/:id', authenticateToken, requireAdmin, validateObjectId('id'), validateEquipmentUpdate, updateEquipment);

/**
 * @route   DELETE /api/equipment/:id
 * @desc    Xóa thiết bị (soft delete)
 * @access  Private (Admin)
 */
router.delete('/:id', authenticateToken, requireAdmin, validateObjectId('id'), deleteEquipment);

module.exports = router; 