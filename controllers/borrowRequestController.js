const BorrowRequest = require('../models/BorrowRequest');
const User = require('../models/User');
const Equipment = require('../models/Equipment');

// Lấy danh sách requests (có filter cơ bản)
const getBorrowRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    
    // Nếu là student thì chỉ xem requests của mình
    if (req.user.role === 'student') {
      filter.borrower = req.user.id;
    }

    const skip = (page - 1) * limit;
    
    const requests = await BorrowRequest.find(filter)
      .populate('borrower', 'fullName email studentId')
      .populate('equipments.equipment', 'name code category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BorrowRequest.countDocuments(filter);

    res.json({
      success: true,
      data: requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting borrow requests:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách yêu cầu mượn',
      error: error.message
    });
  }
};

// Tạo yêu cầu mượn mới (đơn giản)
const createBorrowRequest = async (req, res) => {
  try {
    const { equipments, borrowDate, expectedReturnDate, purpose, notes } = req.body;
    const borrowerId = req.user.id;

    // Validation cơ bản
    if (!equipments || equipments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất 1 thiết bị'
      });
    }

    if (!borrowDate || !expectedReturnDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ngày mượn và ngày trả'
      });
    }

    if (!purpose || purpose.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Mục đích sử dụng phải có ít nhất 10 ký tự'
      });
    }

    // Kiểm tra equipment tồn tại và đủ số lượng
    for (const item of equipments) {
      console.log('🔍 Checking equipment item:', item);
      
      const equipment = await Equipment.findById(item.equipment);
      console.log('📦 Found equipment:', equipment ? {
        id: equipment._id,
        name: equipment.name,
        availableQuantity: equipment.availableQuantity,
        borrowedQuantity: equipment.borrowedQuantity
      } : 'NOT FOUND');
      
      if (!equipment) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy thiết bị với ID: ${item.equipment}`
        });
      }

      if (equipment.availableQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Thiết bị "${equipment.name}" không đủ số lượng. Có sẵn: ${equipment.availableQuantity}, yêu cầu: ${item.quantity}`
        });
      }
    }

    // Tạo request
    console.log('✅ All equipment validation passed. Creating BorrowRequest...');

    const borrowRequest = new BorrowRequest({
      borrower: borrowerId,
      equipments,
      borrowDate: new Date(borrowDate),
      expectedReturnDate: new Date(expectedReturnDate),
      purpose: purpose.trim(),
      notes: notes ? notes.trim() : '',
      status: 'pending'
    });

    console.log('📝 BorrowRequest object created:', {
      borrower: borrowRequest.borrower,
      equipments: borrowRequest.equipments,
      status: borrowRequest.status
    });

    console.log('💾 Saving BorrowRequest...');
    await borrowRequest.save();
    console.log('✅ BorrowRequest saved successfully');

    // Populate để trả về
    console.log('🔗 Populating borrower...');
    await borrowRequest.populate('borrower', 'fullName email studentId');
    console.log('🔗 Populating equipments...');
    await borrowRequest.populate('equipments.equipment', 'name code category');

    res.status(201).json({
      success: true,
      message: 'Tạo yêu cầu mượn thành công',
      data: borrowRequest
    });
  } catch (error) {
    console.error('Error creating borrow request:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo yêu cầu mượn',
      error: error.message
    });
  }
};

// Duyệt yêu cầu (Admin only)
const approveBorrowRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const borrowRequest = await BorrowRequest.findById(id);
    if (!borrowRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu mượn'
      });
    }

    if (borrowRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Không thể duyệt yêu cầu có trạng thái: ${borrowRequest.status}`
      });
    }

    // Update status
    borrowRequest.status = 'approved';
    borrowRequest.reviewedBy = req.user.id;
    borrowRequest.reviewedAt = new Date();
    borrowRequest.reviewNotes = notes || '';

    await borrowRequest.save();

    await borrowRequest.populate('borrower', 'fullName email studentId');
    await borrowRequest.populate('equipments.equipment', 'name code category');

    res.json({
      success: true,
      message: 'Duyệt yêu cầu mượn thành công',
      data: borrowRequest
    });
  } catch (error) {
    console.error('Error approving borrow request:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi duyệt yêu cầu',
      error: error.message
    });
  }
};

// Từ chối yêu cầu (Admin only)
const rejectBorrowRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do từ chối (ít nhất 5 ký tự)'
      });
    }

    const borrowRequest = await BorrowRequest.findById(id);
    if (!borrowRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu mượn'
      });
    }

    if (borrowRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Không thể từ chối yêu cầu có trạng thái: ${borrowRequest.status}`
      });
    }

    // Update status
    borrowRequest.status = 'rejected';
    borrowRequest.reviewedBy = req.user.id;
    borrowRequest.reviewedAt = new Date();
    borrowRequest.rejectionReason = reason.trim();

    await borrowRequest.save();

    await borrowRequest.populate('borrower', 'fullName email studentId');
    await borrowRequest.populate('equipments.equipment', 'name code category');

    res.json({
      success: true,
      message: 'Từ chối yêu cầu mượn thành công',
      data: borrowRequest
    });
  } catch (error) {
    console.error('Error rejecting borrow request:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi từ chối yêu cầu',
      error: error.message
    });
  }
};

// Cho mượn thiết bị (Admin only) 
const borrowEquipment = async (req, res) => {
  try {
    const { id } = req.params;

    const borrowRequest = await BorrowRequest.findById(id)
      .populate('equipments.equipment');

    if (!borrowRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu mượn'
      });
    }

    if (borrowRequest.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Không thể cho mượn yêu cầu có trạng thái: ${borrowRequest.status}`
      });
    }

    // Cập nhật số lượng thiết bị
    for (const item of borrowRequest.equipments) {
      const equipment = await Equipment.findById(item.equipment._id);
      if (equipment.availableQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Thiết bị "${equipment.name}" không đủ số lượng để cho mượn`
        });
      }
      
      equipment.availableQuantity -= item.quantity;
      equipment.borrowedQuantity += item.quantity;
      await equipment.save();
    }

    // Update request status
    borrowRequest.status = 'borrowed';
    borrowRequest.borrowedBy = req.user.id;
    borrowRequest.borrowedAt = new Date();

    await borrowRequest.save();

    await borrowRequest.populate('borrower', 'fullName email studentId');
    await borrowRequest.populate('equipments.equipment', 'name code category');

    res.json({
      success: true,
      message: 'Cho mượn thiết bị thành công',
      data: borrowRequest
    });
  } catch (error) {
    console.error('Error borrowing equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cho mượn thiết bị',
      error: error.message
    });
  }
};

// Trả thiết bị (Admin only)
const returnEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const borrowRequest = await BorrowRequest.findById(id)
      .populate('equipments.equipment');

    if (!borrowRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu mượn'
      });
    }

    if (borrowRequest.status !== 'borrowed') {
      return res.status(400).json({
        success: false,
        message: `Không thể trả thiết bị có trạng thái: ${borrowRequest.status}`
      });
    }

    // Cập nhật số lượng thiết bị
    for (const item of borrowRequest.equipments) {
      const equipment = await Equipment.findById(item.equipment._id);
      equipment.availableQuantity += item.quantity;
      equipment.borrowedQuantity -= item.quantity;
      await equipment.save();
    }

    // Update request status
    borrowRequest.status = 'returned';
    borrowRequest.returnedBy = req.user.id;
    borrowRequest.returnedAt = new Date();
    borrowRequest.actualReturnDate = new Date();
    if (notes) {
      borrowRequest.notes = (borrowRequest.notes || '') + '\n--- Ghi chú khi trả ---\n' + notes;
    }

    await borrowRequest.save();

    await borrowRequest.populate('borrower', 'fullName email studentId');
    await borrowRequest.populate('equipments.equipment', 'name code category');

    res.json({
      success: true,
      message: 'Trả thiết bị thành công',
      data: borrowRequest
    });
  } catch (error) {
    console.error('Error returning equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi trả thiết bị',
      error: error.message
    });
  }
};

// Thống kê đơn giản
const getStats = async (req, res) => {
  try {
    const stats = {
      total: await BorrowRequest.countDocuments(),
      pending: await BorrowRequest.countDocuments({ status: 'pending' }),
      approved: await BorrowRequest.countDocuments({ status: 'approved' }),
      borrowed: await BorrowRequest.countDocuments({ status: 'borrowed' }),
      returned: await BorrowRequest.countDocuments({ status: 'returned' }),
      rejected: await BorrowRequest.countDocuments({ status: 'rejected' })
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê',
      error: error.message
    });
  }
};

module.exports = {
  getBorrowRequests,
  createBorrowRequest,
  approveBorrowRequest,
  rejectBorrowRequest,
  borrowEquipment,
  returnEquipment,
  getStats
}; 