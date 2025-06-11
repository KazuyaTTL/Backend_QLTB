const BorrowRequest = require('../models/BorrowRequest');
const User = require('../models/User');
const Equipment = require('../models/Equipment');
const notificationService = require('../services/notificationService');

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

// Tạo yêu cầu mượn mới (với borrow limits)
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

    // === KIỂM TRA BORROW LIMITS ===
    console.log('🔍 Checking borrow limits for user:', req.user.id);
    
    // Lấy thông tin user với borrow tracking
    const borrower = await User.findById(borrowerId);
    if (!borrower) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    // Bỏ restrictions đã hết hạn
    await borrower.removeExpiredRestrictions();

    // Tính tổng số lượng thiết bị yêu cầu
    const totalRequestQuantity = equipments.reduce((sum, item) => sum + item.quantity, 0);
    console.log(`📊 Current borrow count: ${borrower.currentBorrowCount}/${borrower.borrowLimit}`);
    console.log(`📦 Requesting: ${totalRequestQuantity} items`);

    // Kiểm tra có thể tạo request không (bao gồm cả pending requests)
    const borrowCheck = await borrower.canCreateRequest(totalRequestQuantity);
    if (!borrowCheck.allowed) {
      console.log('❌ Borrow limit exceeded:', borrowCheck.reason);
      return res.status(400).json({
        success: false,
        message: borrowCheck.reason,
        details: {
          currentBorrowCount: borrower.currentBorrowCount,
          pendingCount: borrowCheck.pendingCount || 0,
          requestedCount: totalRequestQuantity,
          borrowLimit: borrower.borrowLimit,
          total: borrowCheck.total || borrower.currentBorrowCount + totalRequestQuantity,
          isRestricted: borrower.isRestricted,
          restrictions: borrowCheck.restrictions
        }
      });
    }

    console.log('✅ Borrow limits OK:', {
      current: borrowCheck.currentCount,
      pending: borrowCheck.pendingCount,
      requested: borrowCheck.requestedCount,
      total: borrowCheck.total,
      limit: borrowCheck.limit,
      remaining: borrowCheck.remaining
    });

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

    // Generate request number
    console.log('🔢 Generating request number...');
    const count = await BorrowRequest.countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const requestNumber = `BR${year}${month}${(count + 1).toString().padStart(4, '0')}`;
    console.log('🔢 Generated request number:', requestNumber);

    // Tạo request
    console.log('✅ All validations passed. Creating BorrowRequest...');

    const borrowRequest = new BorrowRequest({
      requestNumber,
      borrower: borrowerId,
      equipments,
      borrowDate: new Date(borrowDate),
      expectedReturnDate: new Date(expectedReturnDate),
      purpose: purpose.trim(),
      notes: notes ? notes.trim() : '',
      status: 'pending'
    });

    console.log('📝 BorrowRequest object created:', {
      requestNumber: borrowRequest.requestNumber,
      borrower: borrowRequest.borrower,
      equipments: borrowRequest.equipments,
      status: borrowRequest.status,
      totalQuantity: totalRequestQuantity
    });

    console.log('💾 Saving BorrowRequest...');
    await borrowRequest.save();
    console.log('✅ BorrowRequest saved successfully');

    // Populate để trả về
    console.log('🔗 Populating borrower...');
    await borrowRequest.populate('borrower', 'fullName email studentId currentBorrowCount borrowLimit');
    console.log('🔗 Populating equipments...');
    await borrowRequest.populate('equipments.equipment', 'name code category');

    res.status(201).json({
      success: true,
      message: 'Tạo yêu cầu mượn thành công',
      data: borrowRequest,
      borrowStatus: {
        currentBorrowCount: borrower.currentBorrowCount,
        pendingCount: borrowCheck.pendingCount || 0,
        requestedCount: totalRequestQuantity,
        borrowLimit: borrower.borrowLimit,
        totalCommitted: borrowCheck.total,
        remainingSlots: borrowCheck.remaining
      }
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

    const borrowRequest = await BorrowRequest.findById(id)
      .populate('equipments.equipment')
      .populate('borrower');

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

    // === KIỂM TRA LẠI BORROW LIMITS KHI APPROVE ===
    const borrower = await User.findById(borrowRequest.borrower._id);
    await borrower.removeExpiredRestrictions();

    const totalRequestQuantity = borrowRequest.equipments.reduce((sum, item) => sum + item.quantity, 0);
    
    // Kiểm tra giới hạn đơn giản
    const borrowCheck = borrower.canBorrow(totalRequestQuantity);
    
    if (!borrowCheck.allowed) {
      console.log('❌ Borrow limit exceeded at approve time:', borrowCheck.reason);
      return res.status(400).json({
        success: false,
        message: `Không thể duyệt: ${borrowCheck.reason}`,
        details: {
          currentBorrowCount: borrower.currentBorrowCount,
          borrowLimit: borrower.borrowLimit,
          isRestricted: borrower.isRestricted
        }
      });
    }

    // Kiểm tra và cập nhật số lượng thiết bị
    for (const item of borrowRequest.equipments) {
      const equipment = await Equipment.findById(item.equipment._id);
      if (equipment.availableQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Thiết bị "${equipment.name}" không đủ số lượng để cho mượn. Có sẵn: ${equipment.availableQuantity}, yêu cầu: ${item.quantity}`
        });
      }
      
      // Trừ số lượng thiết bị ngay khi approve
      equipment.availableQuantity -= item.quantity;
      equipment.borrowedQuantity += item.quantity;
      await equipment.save();
    }

    // === CẬP NHẬT BORROW COUNT CỦA USER ===
    console.log(`📊 Updating borrow count: ${borrower.currentBorrowCount} + ${totalRequestQuantity}`);
    await borrower.updateBorrowCount(totalRequestQuantity, borrowRequest._id);
    console.log(`📊 New borrow count: ${borrower.currentBorrowCount + totalRequestQuantity}`);

    // Update status thành borrowed luôn (bỏ qua approved)
    borrowRequest.status = 'borrowed';
    borrowRequest.reviewedBy = req.user.id;
    borrowRequest.reviewedAt = new Date();
    borrowRequest.reviewNotes = notes || '';
    borrowRequest.borrowedBy = req.user.id;
    borrowRequest.borrowedAt = new Date();

    await borrowRequest.save();

    await borrowRequest.populate('borrower', 'fullName email studentId currentBorrowCount borrowLimit');
    await borrowRequest.populate('equipments.equipment', 'name code category');

    // Gửi thông báo đến người dùng
    try {
      await notificationService.createBorrowSuccessNotification(borrowRequest);
      console.log('📱 Đã gửi thông báo duyệt yêu cầu thành công');
    } catch (notifError) {
      console.error('❌ Lỗi gửi thông báo:', notifError.message);
    }

    res.json({
      success: true,
      message: 'Duyệt và cho mượn thiết bị thành công',
      data: borrowRequest,
      borrowStatus: {
        currentBorrowCount: borrower.currentBorrowCount + totalRequestQuantity,
        borrowLimit: borrower.borrowLimit,
        remainingSlots: borrower.borrowLimit - (borrower.currentBorrowCount + totalRequestQuantity)
      }
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

    // Gửi thông báo từ chối đến người dùng
    try {
      await notificationService.createRequestRejectedNotification(borrowRequest, reason.trim());
      console.log('📱 Đã gửi thông báo từ chối yêu cầu');
    } catch (notifError) {
      console.error('❌ Lỗi gửi thông báo:', notifError.message);
    }

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
      .populate('equipments.equipment')
      .populate('borrower');

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

    // === KIỂM TRA QUÁ HẠN ===
    const now = new Date();
    const isOverdue = now > borrowRequest.expectedReturnDate;
    console.log(`📅 Expected return: ${borrowRequest.expectedReturnDate}, Now: ${now}, Overdue: ${isOverdue}`);

    // Cập nhật số lượng thiết bị
    for (const item of borrowRequest.equipments) {
      const equipment = await Equipment.findById(item.equipment._id);
      equipment.availableQuantity += item.quantity;
      equipment.borrowedQuantity -= item.quantity;
      await equipment.save();
    }

    // === CẬP NHẬT BORROW COUNT CỦA USER ===
    const borrower = await User.findById(borrowRequest.borrower._id);
    const totalReturnQuantity = borrowRequest.equipments.reduce((sum, item) => sum + item.quantity, 0);
    
    console.log(`📊 Updating borrow count: ${borrower.currentBorrowCount} - ${totalReturnQuantity}`);
    await borrower.updateBorrowCount(-totalReturnQuantity, borrowRequest._id);
    console.log(`📊 New borrow count: ${borrower.currentBorrowCount - totalReturnQuantity}`);

    // === XỬ LÝ VI PHẠM QUÁ HẠN ===
    if (isOverdue) {
      console.log('⚠️ Overdue return detected, applying penalties...');
      await borrower.handleOverdue();
      
      // Thêm vào borrowHistory với action 'overdue'
      borrower.borrowHistory.push({
        requestId: borrowRequest._id,
        action: 'overdue',
        date: new Date(),
        equipmentCount: totalReturnQuantity
      });
      await borrower.save();
    }

    // Update request status
    borrowRequest.status = 'returned';
    borrowRequest.returnedBy = req.user.id;
    borrowRequest.returnedAt = new Date();
    borrowRequest.actualReturnDate = new Date();
    
    if (notes) {
      borrowRequest.notes = (borrowRequest.notes || '') + '\n--- Ghi chú khi trả ---\n' + notes;
    }
    
    if (isOverdue) {
      const overdueDays = Math.ceil((now - borrowRequest.expectedReturnDate) / (1000 * 60 * 60 * 24));
      borrowRequest.notes = (borrowRequest.notes || '') + `\n--- CẢNH BÁO ---\nTrả muộn ${overdueDays} ngày!`;
    }

    await borrowRequest.save();

    await borrowRequest.populate('borrower', 'fullName email studentId currentBorrowCount borrowLimit overdueCount');
    await borrowRequest.populate('equipments.equipment', 'name code category');

    // Gửi thông báo trả thiết bị thành công
    try {
      await notificationService.createReturnSuccessNotification(borrowRequest);
      console.log('📱 Đã gửi thông báo trả thiết bị thành công');
    } catch (notifError) {
      console.error('❌ Lỗi gửi thông báo:', notifError.message);
    }

    res.json({
      success: true,
      message: isOverdue ? 
        `Nhận trả thiết bị thành công (MUỘN ${Math.ceil((now - borrowRequest.expectedReturnDate) / (1000 * 60 * 60 * 24))} ngày)` : 
        'Nhận trả thiết bị thành công',
      data: borrowRequest,
      borrowStatus: {
        currentBorrowCount: borrower.currentBorrowCount - totalReturnQuantity,
        borrowLimit: borrower.borrowLimit,
        remainingSlots: borrower.borrowLimit - (borrower.currentBorrowCount - totalReturnQuantity),
        overdueCount: isOverdue ? borrower.overdueCount + 1 : borrower.overdueCount,
        isOverdue: isOverdue
      },
      penalties: isOverdue ? {
        applied: true,
        newOverdueCount: borrower.overdueCount + 1,
        restrictions: borrower.borrowRestrictions.filter(r => !r.endDate || r.endDate > new Date())
      } : null
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

// Xem tổng quan pending requests của user (Admin only)
const getUserPendingOverview = async (req, res) => {
  try {
    const { userId } = req.params;

    // Lấy thông tin user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Lấy tất cả pending requests của user
    const pendingRequests = await BorrowRequest.find({
      borrower: userId,
      status: 'pending'
    })
    .populate('equipments.equipment', 'name code category')
    .sort({ createdAt: -1 });

    // Tính tổng số lượng thiết bị trong pending requests
    const totalPendingQuantity = pendingRequests.reduce((total, request) => {
      return total + request.equipments.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);

    // Tính các scenarios duyệt
    const scenarios = [];
    let currentCount = user.currentBorrowCount;
    
    for (let i = 0; i < pendingRequests.length; i++) {
      const request = pendingRequests[i];
      const requestQuantity = request.equipments.reduce((sum, item) => sum + item.quantity, 0);
      
      scenarios.push({
        requestId: request._id,
        requestNumber: request.requestNumber,
        quantity: requestQuantity,
        canApprove: (currentCount + requestQuantity) <= user.borrowLimit,
        newTotal: currentCount + requestQuantity,
        remainingSlots: user.borrowLimit - (currentCount + requestQuantity),
        equipments: request.equipments.map(item => ({
          name: item.equipment.name,
          code: item.equipment.code,
          quantity: item.quantity
        }))
      });
      
      // Giả sử approve request này
      if ((currentCount + requestQuantity) <= user.borrowLimit) {
        currentCount += requestQuantity;
      }
    }

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          fullName: user.fullName,
          studentId: user.studentId,
          email: user.email,
          currentBorrowCount: user.currentBorrowCount,
          borrowLimit: user.borrowLimit,
          isRestricted: user.isRestricted
        },
        overview: {
          totalPendingRequests: pendingRequests.length,
          totalPendingQuantity: totalPendingQuantity,
          currentBorrowCount: user.currentBorrowCount,
          borrowLimit: user.borrowLimit,
          remainingSlots: user.borrowLimit - user.currentBorrowCount,
          wouldExceedLimit: (user.currentBorrowCount + totalPendingQuantity) > user.borrowLimit,
          excessQuantity: Math.max(0, (user.currentBorrowCount + totalPendingQuantity) - user.borrowLimit)
        },
        pendingRequests: pendingRequests,
        approvalScenarios: scenarios,
        recommendations: {
          canApproveAll: (user.currentBorrowCount + totalPendingQuantity) <= user.borrowLimit,
          maxApprovableRequests: scenarios.filter(s => s.canApprove).length,
          suggestedOrder: scenarios
            .filter(s => s.canApprove)
            .sort((a, b) => new Date(pendingRequests.find(r => r._id.toString() === a.requestId).createdAt) - 
                            new Date(pendingRequests.find(r => r._id.toString() === b.requestId).createdAt))
            .map(s => s.requestNumber)
        }
      }
    });
  } catch (error) {
    console.error('Error getting user pending overview:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy tổng quan yêu cầu pending',
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
  getStats,
  getUserPendingOverview
}; 