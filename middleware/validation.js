const { body, param, query, validationResult } = require('express-validator');

// Middleware xử lý kết quả validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Validation cho đăng ký
const validateRegister = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Họ tên phải từ 2-100 ký tự'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email không hợp lệ'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  
  body('studentId')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Mã sinh viên phải từ 3-20 ký tự'),
  
  body('phone')
    .optional()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Số điện thoại không hợp lệ'),
  
  body('faculty')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên khoa phải từ 2-100 ký tự'),
  
  body('class')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên lớp phải từ 2-50 ký tự'),
  
  handleValidationErrors
];

// Validation cho đăng nhập
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email không hợp lệ'),
  
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu không được để trống'),
  
  handleValidationErrors
];

// Validation cho tạo thiết bị (CREATE - yêu cầu đầy đủ)
const validateEquipment = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên thiết bị phải từ 2-100 ký tự'),
  
  body('code')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Mã thiết bị phải từ 3-50 ký tự'),
  
  body('category')
    .isIn(['electronics', 'furniture', 'sports', 'laboratory', 'audio_visual', 'other'])
    .withMessage('Loại thiết bị không hợp lệ'),
  
  body('totalQuantity')
    .isInt({ min: 0 })
    .withMessage('Tổng số lượng phải là số nguyên không âm'),
  
  body('availableQuantity')
    .isInt({ min: 0 })
    .withMessage('Số lượng có sẵn phải là số nguyên không âm'),
  
  body('location.building')
    .trim()
    .notEmpty()
    .withMessage('Tòa nhà không được để trống'),
  
  body('location.floor')
    .trim()
    .notEmpty()
    .withMessage('Tầng không được để trống'),
  
  body('location.room')
    .trim()
    .notEmpty()
    .withMessage('Phòng không được để trống'),
  
  body('condition')
    .optional()
    .isIn(['new', 'good', 'fair', 'poor', 'damaged'])
    .withMessage('Tình trạng thiết bị không hợp lệ'),
  
  handleValidationErrors
];

// Validation cho cập nhật thiết bị (UPDATE - partial validation)
const validateEquipmentUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên thiết bị phải từ 2-100 ký tự'),
  
  body('code')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Mã thiết bị phải từ 3-50 ký tự'),
  
  body('category')
    .optional()
    .isIn(['electronics', 'furniture', 'sports', 'laboratory', 'audio_visual', 'other'])
    .withMessage('Loại thiết bị không hợp lệ'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được vượt quá 500 ký tự'),
  
  body('specifications')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Thông số kỹ thuật không được vượt quá 1000 ký tự'),
  
  body('totalQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Tổng số lượng phải là số nguyên không âm'),
  
  body('availableQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Số lượng có sẵn phải là số nguyên không âm'),
  
  body('condition')
    .optional()
    .isIn(['new', 'good', 'fair', 'poor', 'damaged'])
    .withMessage('Tình trạng thiết bị không hợp lệ'),
  
  body('location.building')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Tòa nhà không được để trống'),
  
  body('location.floor')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Tầng không được để trống'),
  
  body('location.room')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phòng không được để trống'),
  
  body('purchaseDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày mua không hợp lệ'),
  
  body('purchasePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Giá mua phải là số không âm'),
  
  body('warrantyExpiry')
    .optional()
    .isISO8601()
    .withMessage('Ngày hết hạn bảo hành không hợp lệ'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Ghi chú không được vượt quá 1000 ký tự'),
  
  handleValidationErrors
];

// Validation cho yêu cầu mượn thiết bị
const validateBorrowRequest = [
  body('equipments')
    .isArray({ min: 1 })
    .withMessage('Phải có ít nhất 1 thiết bị trong yêu cầu'),
  
  body('equipments.*.equipment')
    .isMongoId()
    .withMessage('ID thiết bị không hợp lệ'),
  
  body('equipments.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Số lượng mượn phải là số nguyên dương'),
  
  body('borrowDate')
    .isISO8601()
    .toDate()
    .withMessage('Ngày mượn không hợp lệ'),
  
  body('expectedReturnDate')
    .isISO8601()
    .toDate()
    .withMessage('Ngày trả dự kiến không hợp lệ'),
  
  body('purpose')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Mục đích sử dụng phải từ 10-500 ký tự'),
  
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Mức độ ưu tiên không hợp lệ'),
  
  handleValidationErrors
];

// Validation cho duyệt yêu cầu
const validateApproveRequest = [
  body('reviewNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Ghi chú duyệt không được vượt quá 500 ký tự'),
  
  handleValidationErrors
];

// Validation cho từ chối yêu cầu
const validateRejectRequest = [
  body('rejectionReason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Lý do từ chối phải từ 10-500 ký tự'),
  
  handleValidationErrors
];

// Validation cho ObjectId
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`${paramName} không hợp lệ`),
  
  handleValidationErrors
];

// Validation cho query pagination
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trang phải là số nguyên dương'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Giới hạn phải từ 1-100'),
  
  query('sortBy')
    .optional()
    .isString()
    .withMessage('Trường sắp xếp không hợp lệ'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Thứ tự sắp xếp phải là asc hoặc desc'),
  
  handleValidationErrors
];

// Validation cho tìm kiếm thiết bị
const validateEquipmentSearch = [
  query('keyword')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Từ khóa tìm kiếm phải có ít nhất 2 ký tự'),
  
  query('category')
    .optional()
    .isIn(['electronics', 'furniture', 'sports', 'laboratory', 'audio_visual', 'other'])
    .withMessage('Loại thiết bị không hợp lệ'),
  
  query('condition')
    .optional()
    .isIn(['new', 'good', 'fair', 'poor', 'damaged'])
    .withMessage('Tình trạng thiết bị không hợp lệ'),
  
  query('available')
    .optional()
    .isBoolean()
    .withMessage('Trạng thái có sẵn phải là true/false'),
  
  ...validatePagination
];

// Validation cho cập nhật profile
const validateUpdateProfile = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Họ tên phải từ 2-100 ký tự'),
  
  body('phone')
    .optional()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Số điện thoại không hợp lệ'),
  
  body('faculty')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên khoa phải từ 2-100 ký tự'),
  
  body('class')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên lớp phải từ 2-50 ký tự'),
  
  handleValidationErrors
];

// Validation cho đổi mật khẩu
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mật khẩu hiện tại không được để trống'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Xác nhận mật khẩu không khớp');
      }
      return true;
    }),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateEquipment,
  validateEquipmentUpdate,
  validateBorrowRequest,
  validateApproveRequest,
  validateRejectRequest,
  validateObjectId,
  validatePagination,
  validateEquipmentSearch,
  validateUpdateProfile,
  validateChangePassword
}; 