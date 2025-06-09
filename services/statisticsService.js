const BorrowRequest = require('../models/BorrowRequest');
const Equipment = require('../models/Equipment');

class StatisticsService {
  // Thống kê thiết bị mượn nhiều nhất trong tháng
  async getMostBorrowedEquipmentInMonth(year, month) {
    try {
      // Tạo khoảng thời gian cho tháng
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const statistics = await BorrowRequest.aggregate([
        {
          // Lọc requests được approved trong tháng
          $match: {
            status: { $in: ['approved', 'borrowed', 'returned'] },
            approvedAt: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          // Nhóm theo equipment và đếm số lần mượn
          $group: {
            _id: '$equipment',
            borrowCount: { $sum: 1 },
            totalQuantityBorrowed: { $sum: '$quantity' }
          }
        },
        {
          // Lookup thông tin equipment
          $lookup: {
            from: 'equipment',
            localField: '_id',
            foreignField: '_id',
            as: 'equipmentInfo'
          }
        },
        {
          // Unwind equipment info
          $unwind: '$equipmentInfo'
        },
        {
          // Chọn fields cần thiết
          $project: {
            _id: 1,
            borrowCount: 1,
            totalQuantityBorrowed: 1,
            equipment: {
              _id: '$equipmentInfo._id',
              name: '$equipmentInfo.name',
              code: '$equipmentInfo.code',
              category: '$equipmentInfo.category',
              totalQuantity: '$equipmentInfo.quantity'
            }
          }
        },
        {
          // Sắp xếp theo số lần mượn giảm dần
          $sort: { borrowCount: -1, totalQuantityBorrowed: -1 }
        },
        {
          // Giới hạn top 10
          $limit: 10
        }
      ]);

      return {
        month: month,
        year: year,
        period: `${month}/${year}`,
        statistics: statistics
      };
    } catch (error) {
      throw new Error(`Lỗi khi thống kê: ${error.message}`);
    }
  }

  // Thống kê tổng quan trong tháng
  async getMonthlyOverview(year, month) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const overview = await BorrowRequest.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            approvedRequests: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
            },
            borrowedRequests: {
              $sum: { $cond: [{ $eq: ['$status', 'borrowed'] }, 1, 0] }
            },
            returnedRequests: {
              $sum: { $cond: [{ $eq: ['$status', 'returned'] }, 1, 0] }
            },
            rejectedRequests: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
            },
            pendingRequests: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            }
          }
        }
      ]);

      return {
        month: month,
        year: year,
        overview: overview[0] || {
          totalRequests: 0,
          approvedRequests: 0,
          borrowedRequests: 0,
          returnedRequests: 0,
          rejectedRequests: 0,
          pendingRequests: 0
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi thống kê tổng quan: ${error.message}`);
    }
  }
}

module.exports = new StatisticsService(); 