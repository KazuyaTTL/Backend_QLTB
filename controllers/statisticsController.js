const statisticsService = require('../services/statisticsService');
const emailService = require('../services/emailService');

// Lấy thống kê thiết bị mượn nhiều nhất trong tháng
exports.getMostBorrowedEquipment = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    // Validation
    const currentDate = new Date();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;

    if (targetMonth < 1 || targetMonth > 12) {
      return res.status(400).json({
        status: 'error',
        message: 'Tháng phải từ 1 đến 12'
      });
    }

    if (targetYear < 2020 || targetYear > currentDate.getFullYear() + 1) {
      return res.status(400).json({
        status: 'error',
        message: 'Năm không hợp lệ'
      });
    }

    const statistics = await statisticsService.getMostBorrowedEquipmentInMonth(targetYear, targetMonth);

    res.status(200).json({
      status: 'success',
      message: 'Lấy thống kê thiết bị mượn nhiều nhất thành công',
      data: statistics
    });

  } catch (error) {
    console.error('Lỗi lấy thống kê thiết bị:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi lấy thống kê'
    });
  }
};

// Lấy tổng quan thống kê tháng
exports.getMonthlyOverview = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    const currentDate = new Date();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;

    const overview = await statisticsService.getMonthlyOverview(targetYear, targetMonth);

    res.status(200).json({
      status: 'success',
      message: 'Lấy tổng quan thống kê thành công',
      data: overview
    });

  } catch (error) {
    console.error('Lỗi lấy tổng quan thống kê:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi lấy tổng quan thống kê'
    });
  }
};

// Lấy thống kê hiện tại (tháng này)
exports.getCurrentStatistics = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Lấy cả thống kê thiết bị và tổng quan
    const [equipmentStats, overview] = await Promise.all([
      statisticsService.getMostBorrowedEquipmentInMonth(currentYear, currentMonth),
      statisticsService.getMonthlyOverview(currentYear, currentMonth)
    ]);

    res.status(200).json({
      status: 'success',
      message: 'Lấy thống kê hiện tại thành công',
      data: {
        currentMonth: currentMonth,
        currentYear: currentYear,
        mostBorrowedEquipment: equipmentStats.statistics,
        overview: overview.overview
      }
    });

  } catch (error) {
    console.error('Lỗi lấy thống kê hiện tại:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi lấy thống kê hiện tại'
    });
  }
};

// So sánh thống kê giữa 2 tháng
exports.compareMonthlyStatistics = async (req, res) => {
  try {
    const { year1, month1, year2, month2 } = req.query;

    if (!year1 || !month1 || !year2 || !month2) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp đầy đủ thông tin 2 tháng để so sánh'
      });
    }

    const [stats1, stats2] = await Promise.all([
      statisticsService.getMostBorrowedEquipmentInMonth(parseInt(year1), parseInt(month1)),
      statisticsService.getMostBorrowedEquipmentInMonth(parseInt(year2), parseInt(month2))
    ]);

    res.status(200).json({
      status: 'success',
      message: 'So sánh thống kê thành công',
      data: {
        period1: stats1,
        period2: stats2
      }
    });

  } catch (error) {
    console.error('Lỗi so sánh thống kê:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi so sánh thống kê'
    });
  }
};

// Gửi cảnh báo hạn trả thủ công (Admin only)
exports.sendDueDateWarnings = async (req, res) => {
  try {
    console.log('🔄 Admin triggered manual due date warnings...');
    
    // Gọi service để kiểm tra và gửi cảnh báo
    const result = await emailService.checkAndSendDueDateWarnings();
    
    res.status(200).json({
      status: 'success',
      message: 'Gửi cảnh báo hạn trả thành công',
      data: {
        totalWarningsSent: result.totalWarningsSent || 0,
        dueSoonWarnings: result.dueSoonWarnings || 0,
        overdueWarnings: result.overdueWarnings || 0,
        details: result.details || [],
        triggeredAt: new Date(),
        triggeredBy: req.user.fullName || req.user.email
      }
    });

  } catch (error) {
    console.error('❌ Lỗi gửi cảnh báo hạn trả:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi server khi gửi cảnh báo hạn trả'
    });
  }
}; 