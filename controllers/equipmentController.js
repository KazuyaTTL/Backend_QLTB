const Equipment = require('../models/Equipment');
const BorrowRequest = require('../models/BorrowRequest');

// Lấy danh sách thiết bị (có phân trang và tìm kiếm)
const getEquipments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      keyword,
      category,
      condition,
      available,
      building,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // ✅ VALIDATION: Valid enum values
    const validCategories = ['electronics', 'furniture', 'sports', 'laboratory', 'audio_visual', 'other'];
    const validConditions = ['new', 'good', 'fair', 'poor', 'damaged'];
    const validSortFields = ['name', 'code', 'category', 'condition', 'createdAt', 'updatedAt'];
    
    // Validate category
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid category. Valid values: ${validCategories.join(', ')}`,
        validCategories
      });
    }
    
    // Validate condition  
    if (condition && !validConditions.includes(condition)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid condition. Valid values: ${validConditions.join(', ')}`,
        validConditions
      });
    }
    
    // Validate available parameter
    if (available && !['true', 'false'].includes(available)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid available parameter. Use "true" or "false"'
      });
    }
    
    // Validate sort parameters
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        status: 'error', 
        message: `Invalid sortBy field. Valid values: ${validSortFields.join(', ')}`,
        validSortFields
      });
    }
    
    if (!['asc', 'desc'].includes(sortOrder)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid sortOrder. Use "asc" or "desc"'
      });
    }

    // Build filter object
    const filter = { isActive: true };

    // Text search
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { code: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Condition filter
    if (condition) {
      filter.condition = condition;
    }

    // Available filter
    if (available !== undefined) {
      if (available === 'true') {
        filter.availableQuantity = { $gt: 0 };
      } else if (available === 'false') {
        filter.availableQuantity = 0;
      }
    }

    // Building filter
    if (building) {
      filter['location.building'] = building;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [equipments, totalCount] = await Promise.all([
      Equipment.find(filter)
        .populate('createdBy', 'fullName email')
        .populate('updatedBy', 'fullName email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Equipment.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      status: 'success',
      data: {
        equipments,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: parseInt(limit),
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('Get equipments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi lấy danh sách thiết bị'
    });
  }
};

// Lấy thiết bị theo ID
const getEquipmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const equipment = await Equipment.findOne({ _id: id, isActive: true })
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email');

    if (!equipment) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy thiết bị'
      });
    }

    res.json({
      status: 'success',
      data: {
        equipment
      }
    });

  } catch (error) {
    console.error('Get equipment by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi lấy thông tin thiết bị'
    });
  }
};

// Tạo thiết bị mới (chỉ admin)
const createEquipment = async (req, res) => {
  try {
    const equipmentData = {
      ...req.body,
      createdBy: req.user._id,
      borrowedQuantity: 0 // Thiết bị mới chưa được mượn
    };

    // Ensure availableQuantity = totalQuantity for new equipment
    if (!equipmentData.availableQuantity) {
      equipmentData.availableQuantity = equipmentData.totalQuantity;
    }

    const equipment = await Equipment.create(equipmentData);

    const populatedEquipment = await Equipment.findById(equipment._id)
      .populate('createdBy', 'fullName email');

    res.status(201).json({
      status: 'success',
      message: 'Tạo thiết bị thành công',
      data: {
        equipment: populatedEquipment
      }
    });

  } catch (error) {
    console.error('Create equipment error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Mã thiết bị đã tồn tại'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi tạo thiết bị'
    });
  }
};

// Cập nhật thiết bị (chỉ admin)
const updateEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    // Không cho phép cập nhật borrowedQuantity trực tiếp
    delete updateData.borrowedQuantity;

    const equipment = await Equipment.findOneAndUpdate(
      { _id: id, isActive: true },
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy updatedBy', 'fullName email');

    if (!equipment) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy thiết bị'
      });
    }

    res.json({
      status: 'success',
      message: 'Cập nhật thiết bị thành công',
      data: {
        equipment
      }
    });

  } catch (error) {
    console.error('Update equipment error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Mã thiết bị đã tồn tại'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi cập nhật thiết bị'
    });
  }
};

// Xóa thiết bị (soft delete - chỉ admin)
const deleteEquipment = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra thiết bị có đang được mượn không
    const equipment = await Equipment.findById(id);
    if (!equipment) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy thiết bị'
      });
    }

    if (equipment.borrowedQuantity > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Không thể xóa thiết bị đang được mượn'
      });
    }

    // Soft delete
    await Equipment.findByIdAndUpdate(id, {
      isActive: false,
      updatedBy: req.user._id
    });

    res.json({
      status: 'success',
      message: 'Xóa thiết bị thành công'
    });

  } catch (error) {
    console.error('Delete equipment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi xóa thiết bị'
    });
  }
};

// Lấy danh sách thiết bị có sẵn để mượn
const getAvailableEquipments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      keyword,
      category,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // ✅ VALIDATION: Valid enum values  
    const validCategories = ['electronics', 'furniture', 'sports', 'laboratory', 'audio_visual', 'other'];
    const validSortFields = ['name', 'code', 'category', 'condition', 'availableQuantity'];
    
    // Validate category
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid category. Valid values: ${validCategories.join(', ')}`,
        validCategories
      });
    }
    
    // Validate sort parameters
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid sortBy field. Valid values: ${validSortFields.join(', ')}`,
        validSortFields
      });
    }
    
    if (!['asc', 'desc'].includes(sortOrder)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid sortOrder. Use "asc" or "desc"'
      });
    }

    // Filter chỉ thiết bị có sẵn
    const filter = {
      isActive: true,
      availableQuantity: { $gt: 0 }
    };

    // Text search
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { code: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [equipments, totalCount] = await Promise.all([
      Equipment.find(filter)
        .select('name code category description specifications availableQuantity totalQuantity condition location images')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Equipment.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      status: 'success',
      data: {
        equipments,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get available equipments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi lấy danh sách thiết bị có sẵn'
    });
  }
};

// Lấy thống kê thiết bị
const getEquipmentStats = async (req, res) => {
  try {
    // Thống kê tổng quan
    const totalStats = await Equipment.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalEquipments: { $sum: 1 },
          totalQuantity: { $sum: '$totalQuantity' },
          availableQuantity: { $sum: '$availableQuantity' },
          borrowedQuantity: { $sum: '$borrowedQuantity' }
        }
      }
    ]);

    // Thống kê theo danh mục
    const categoryStats = await Equipment.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$totalQuantity' },
          availableQuantity: { $sum: '$availableQuantity' },
          borrowedQuantity: { $sum: '$borrowedQuantity' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Thống kê theo tình trạng
    const conditionStats = await Equipment.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$condition',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$totalQuantity' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Thiết bị được mượn nhiều nhất
    const topBorrowedEquipments = await Equipment.find({ isActive: true })
      .select('name code category borrowedQuantity totalQuantity')
      .sort({ borrowedQuantity: -1 })
      .limit(10);

    res.json({
      status: 'success',
      data: {
        overview: totalStats[0] || {
          totalEquipments: 0,
          totalQuantity: 0,
          availableQuantity: 0,
          borrowedQuantity: 0
        },
        categoryStats,
        conditionStats,
        topBorrowedEquipments
      }
    });

  } catch (error) {
    console.error('Get equipment stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi lấy thống kê thiết bị'
    });
  }
};

module.exports = {
  getEquipments,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getAvailableEquipments,
  getEquipmentStats
}; 