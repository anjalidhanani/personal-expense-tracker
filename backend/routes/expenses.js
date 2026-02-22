const express = require('express');
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const { authenticate, requireOwnershipOrAdmin } = require('../middleware/auth');
const { validateExpense, validateObjectId, validateDateRange, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/expenses
// @desc    Get user's expenses with pagination and filtering (only from active categories)
// @access  Private
router.get('/', authenticate, validatePagination, validateDateRange, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, startDate, endDate, minAmount, maxAmount, description, paymentMethod } = req.query;
    
    // Get active categories for this user
    const activeCategories = await Category.find({
      $or: [
        { isDefault: true },
        { createdBy: req.user._id }
      ],
      isActive: true,
      hiddenByUsers: { $ne: req.user._id }
    }).select('_id');
    
    const activeCategoryIds = activeCategories.map(cat => cat._id);
    
    // Build filter object
    const filter = { 
      userId: req.user._id,
      categoryId: { $in: activeCategoryIds }
    };
    
    if (category) {
      // Only allow filtering by active categories
      if (activeCategoryIds.some(id => id.toString() === category)) {
        filter.categoryId = category;
      } else {
        // If requested category is inactive, return empty results
        return res.json({
          success: true,
          data: {
            expenses: [],
            pagination: {
              currentPage: parseInt(page),
              totalPages: 0,
              totalExpenses: 0,
              hasNextPage: false,
              hasPrevPage: false
            },
            totalAmount: 0
          }
        });
      }
    }
    
    if (description) filter.description = { $regex: description, $options: 'i' };
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    
    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    // Amount range filter
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const expenses = await Expense.find(filter)
      .populate('categoryId', 'name color icon')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalExpenses = await Expense.countDocuments(filter);
    const totalPages = Math.ceil(totalExpenses / parseInt(limit));

    // Calculate total amount for filtered expenses
    const totalAmountResult = await Expense.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalAmount = totalAmountResult[0]?.total || 0;

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalExpenses,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        totalAmount
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expenses'
    });
  }
});

// @route   GET /api/expenses/monthly-trend
// @desc    Get monthly expense trend data
// @access  Private
router.get('/monthly-trend', authenticate, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    // Validate year parameter
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year parameter'
      });
    }
    
    // Ensure userId is properly converted to ObjectId
    const mongoose = require('mongoose');
    const userId = new mongoose.Types.ObjectId(req.user._id);
    
    // Get monthly expenses for the specified year
    const monthlyData = await Expense.aggregate([
      {
        $match: {
          userId: userId,
          date: {
            $gte: new Date(`${yearNum}-01-01`),
            $lte: new Date(`${yearNum}-12-31`)
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
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Create array with all 12 months, filling in missing months with 0
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const trendData = monthNames.map((month, index) => {
      const monthData = monthlyData.find(item => item._id === index + 1);
      return {
        month,
        totalAmount: monthData ? monthData.totalAmount : 0,
        count: monthData ? monthData.count : 0
      };
    });

    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    console.error('Get monthly trend error:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while fetching monthly trend'
    });
  }
});

// @route   GET /api/expenses/stats
// @desc    Get user's expense statistics
// @access  Private
router.get('/stats', authenticate, validateDateRange, async (req, res) => {
  try {
    const { startDate, endDate, year = new Date().getFullYear() } = req.query;

    // Get total expenses
    const totalStats = await Expense.getUserTotalExpenses(req.user._id, startDate, endDate);
    const total = totalStats[0] || { totalAmount: 0, count: 0 };

    // Get category-wise expenses
    const categoryStats = await Expense.getCategoryWiseExpenses(req.user._id, startDate, endDate);

    // Get monthly expenses for the year
    const monthlyStats = await Expense.getMonthlyExpenses(req.user._id, parseInt(year));

    // Get recent expenses
    const recentExpenses = await Expense.getRecentExpenses(req.user._id, 5);

    res.json({
      success: true,
      data: {
        total,
        categoryBreakdown: categoryStats,
        monthly: monthlyStats,
        recent: recentExpenses
      }
    });
  } catch (error) {
    console.error('Get expense stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expense statistics'
    });
  }
});

// @route   GET /api/expenses/export
// @desc    Export expenses to CSV
// @access  Private
router.get('/export', authenticate, async (req, res) => {
  try {
    console.log('Export request received with query params:', req.query);
    console.log('User ID:', req.user._id);
    
    const {
      startDate,
      endDate,
      categoryId,
      paymentMethod,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { userId: req.user._id };
    
    // Handle date filtering with validation
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid start date format'
          });
        }
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid end date format'
          });
        }
        query.date.$lte = end;
      }
    }
    
    if (categoryId) query.categoryId = categoryId;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    // Get all expenses for export (no pagination limit)
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const expenses = await Expense.find(query)
      .populate('categoryId', 'name color icon')
      .sort(sortOptions);

    // Generate CSV content
    const csvHeaders = [
      'Date',
      'Description',
      'Amount',
      'Category',
      'Payment Method',
      'Location',
      'Tags',
      'Notes'
    ];

    const csvRows = expenses.map(expense => [
      new Date(expense.date).toLocaleDateString(),
      `"${expense.description.replace(/"/g, '""')}"`,
      expense.amount.toFixed(2),
      expense.categoryId ? `"${expense.categoryId.name}"` : 'Unknown',
      expense.paymentMethod || '',
      expense.location ? `"${expense.location.replace(/"/g, '""')}"` : '',
      expense.tags ? `"${expense.tags.join(', ')}"` : '',
      expense.notes ? `"${expense.notes.replace(/"/g, '""')}"` : ''
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
    res.send(csvContent);

  } catch (error) {
    console.error('Export expenses error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameter format: ' + error.message
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while exporting expenses'
    });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get single expense
// @access  Private
router.get('/:id', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('categoryId', 'name color icon');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      data: { expense }
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expense'
    });
  }
});

// @route   POST /api/expenses
// @desc    Create new expense
// @access  Private
router.post('/', authenticate, validateExpense, async (req, res) => {
  try {
    // Verify category exists and is accessible to user
    const category = await Category.findOne({
      _id: req.body.categoryId,
      $or: [
        { isDefault: true },
        { createdBy: req.user._id }
      ],
      isActive: true
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category selected'
      });
    }

    const expense = new Expense({
      ...req.body,
      userId: req.user._id
    });

    await expense.save();
    await expense.populate('categoryId', 'name color icon');

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: { expense }
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating expense'
    });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Private
router.put('/:id', authenticate, validateObjectId('id'), validateExpense, async (req, res) => {
  try {
    // Find expense and verify ownership
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // If category is being updated, verify it exists and is accessible
    if (req.body.categoryId) {
      const category = await Category.findOne({
        _id: req.body.categoryId,
        $or: [
          { isDefault: true },
          { createdBy: req.user._id }
        ],
        isActive: true
      });

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category selected'
        });
      }
    }

    // Update expense
    Object.assign(expense, req.body);
    await expense.save();
    await expense.populate('categoryId', 'name color icon');

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: { expense }
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating expense'
    });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private
router.delete('/:id', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting expense'
    });
  }
});

// @route   POST /api/expenses/bulk-delete
// @desc    Delete multiple expenses
// @access  Private
router.post('/bulk-delete', authenticate, async (req, res) => {
  try {
    const { expenseIds } = req.body;

    if (!Array.isArray(expenseIds) || expenseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of expense IDs'
      });
    }

    const result = await Expense.deleteMany({
      _id: { $in: expenseIds },
      userId: req.user._id
    });

    res.json({
      success: true,
      message: `${result.deletedCount} expenses deleted successfully`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('Bulk delete expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting expenses'
    });
  }
});

module.exports = router;
