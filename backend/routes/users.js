const express = require('express');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const { authenticate } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user's detailed profile with statistics
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = req.user;

    // Get active categories for this user
    const activeCategories = await Category.find({
      $or: [
        { isDefault: true },
        { createdBy: user._id }
      ],
      isActive: true,
      hiddenByUsers: { $ne: user._id }
    }).select('_id');
    
    const activeCategoryIds = activeCategories.map(cat => cat._id);

    // Get user's expense statistics (only from active categories)
    const expenseStats = await Expense.aggregate([
      { 
        $match: { 
          userId: user._id,
          categoryId: { $in: activeCategoryIds }
        } 
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    // Get this month's expenses (only from active categories)
    const thisMonth = new Date();
    const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
    const endOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0);

    const monthlyStats = await Expense.aggregate([
      {
        $match: {
          userId: user._id,
          categoryId: { $in: activeCategoryIds },
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          monthlyExpenses: { $sum: 1 },
          monthlyAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get category-wise expenses for current month (only active categories)
    const categoryStats = await Expense.aggregate([
      {
        $match: {
          userId: user._id,
          categoryId: { $in: activeCategoryIds },
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$categoryId',
          categoryName: { $first: '$category.name' },
          categoryColor: { $first: '$category.color' },
          categoryIcon: { $first: '$category.icon' },
          totalAmount: { $sum: '$amount' },
          expenseCount: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        user: user.getPublicProfile(),
        stats: {
          overall: expenseStats[0] || { totalExpenses: 0, totalAmount: 0, avgAmount: 0 },
          monthly: monthlyStats[0] || { monthlyExpenses: 0, monthlyAmount: 0 },
          categories: categoryStats
        }
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const user = req.user;

    // Validate input
    if (name && (name.length < 2 || name.length > 50)) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 50 characters'
      });
    }

    // Update fields
    if (name) user.name = name.trim();
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data (only from active categories)
// @access  Private
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Get active categories for this user
    const activeCategories = await Category.find({
      $or: [
        { isDefault: true },
        { createdBy: userId }
      ],
      isActive: true,
      hiddenByUsers: { $ne: userId }
    }).select('_id');
    
    const activeCategoryIds = activeCategories.map(cat => cat._id);

    // Get current month date range
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Get this month's total expenses (only from active categories)
    const monthlyTotal = await Expense.aggregate([
      {
        $match: {
          userId: userId,
          categoryId: { $in: activeCategoryIds },
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    const monthlyStats = monthlyTotal[0] || { totalAmount: 0, count: 0 };

    // Get category-wise expenses for current month (only active categories)
    const categoryStats = await Expense.aggregate([
      {
        $match: {
          userId: userId,
          categoryId: { $in: activeCategoryIds },
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$categoryId',
          categoryName: { $first: '$category.name' },
          categoryColor: { $first: '$category.color' },
          categoryIcon: { $first: '$category.icon' },
          totalAmount: { $sum: '$amount' },
          expenseCount: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Get monthly expenses for the year (for chart) - only active categories
    const monthlyTrends = await Expense.aggregate([
      {
        $match: {
          userId: userId,
          categoryId: { $in: activeCategoryIds },
          date: {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$date' },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get recent expenses (only from active categories)
    const recentExpenses = await Expense.find({
      userId: userId,
      categoryId: { $in: activeCategoryIds }
    })
    .populate('categoryId', 'name color icon')
    .sort({ date: -1, createdAt: -1 })
    .limit(5);

    // Get all-time total (only from active categories)
    const allTimeTotal = await Expense.aggregate([
      {
        $match: {
          userId: userId,
          categoryId: { $in: activeCategoryIds }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    const allTimeStats = allTimeTotal[0] || { totalAmount: 0, count: 0 };

    // Get last month's total for comparison (only from active categories)
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0);
    const lastMonthTotal = await Expense.aggregate([
      {
        $match: {
          userId: userId,
          categoryId: { $in: activeCategoryIds },
          date: { $gte: lastMonthStart, $lte: lastMonthEnd }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    const lastMonthStats = lastMonthTotal[0] || { totalAmount: 0, count: 0 };

    // Calculate percentage change
    const percentageChange = lastMonthStats.totalAmount > 0 
      ? ((monthlyStats.totalAmount - lastMonthStats.totalAmount) / lastMonthStats.totalAmount) * 100
      : monthlyStats.totalAmount > 0 ? 100 : 0;

    res.json({
      success: true,
      data: {
        summary: {
          thisMonth: monthlyStats,
          lastMonth: lastMonthStats,
          allTime: allTimeStats,
          percentageChange: Math.round(percentageChange * 100) / 100
        },
        categoryWise: categoryStats,
        monthlyTrends,
        recentExpenses
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
});

// @route   GET /api/users/expenses/summary
// @desc    Get user's expense summary with various filters
// @access  Private
router.get('/expenses/summary', authenticate, async (req, res) => {
  try {
    const { period = 'month', year = new Date().getFullYear() } = req.query;
    const userId = req.user._id;
    let startDate, endDate;

    // Calculate date range based on period
    switch (period) {
      case 'week':
        const today = new Date();
        const dayOfWeek = today.getDay();
        startDate = new Date(today);
        startDate.setDate(today.getDate() - dayOfWeek);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'month':
        startDate = new Date(year, new Date().getMonth(), 1);
        endDate = new Date(year, new Date().getMonth() + 1, 0);
        break;
      case 'year':
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
        break;
      default:
        startDate = new Date(year, new Date().getMonth(), 1);
        endDate = new Date(year, new Date().getMonth() + 1, 0);
    }

    // Get total expenses for the period
    const totalStats = await Expense.getUserTotalExpenses(userId, startDate, endDate);
    const total = totalStats[0] || { totalAmount: 0, count: 0 };

    // Get category-wise breakdown
    const categoryBreakdown = await Expense.getCategoryWiseExpenses(userId, startDate, endDate);

    // Get daily expenses for the period (for charts)
    const dailyExpenses = await Expense.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        period,
        dateRange: { startDate, endDate },
        total,
        categoryBreakdown,
        dailyExpenses
      }
    });
  } catch (error) {
    console.error('Get expense summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expense summary'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account and all associated data
// @access  Private
router.delete('/account', authenticate, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    // Verify password
    const user = await User.findById(req.user._id).select('+password');
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Prevent admin account deletion
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Admin accounts cannot be deleted'
      });
    }

    // Delete user's expenses
    await Expense.deleteMany({ userId: user._id });

    // Delete user's custom categories
    await Category.deleteMany({ createdBy: user._id });

    // Delete user account
    await User.findByIdAndDelete(user._id);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting account'
    });
  }
});

module.exports = router;
