const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Report = require('../models/Report');
const { authenticate: auth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { body, param, query } = require('express-validator');

// Validation rules for report creation/update
const reportValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Report name must be between 3 and 100 characters'),
  body('type')
    .isIn([
      'expense_summary', 
      'category_breakdown', 
      'monthly_trends', 
      'budget_analysis', 
      'income_vs_expense',
      'payment_method_analysis',
      'spending_patterns',
      'budget_performance',
      'expense_forecasting',
      'top_expenses',
      'savings_analysis',
      'yearly_comparison',
      'quarterly_review',
      'weekly_spending',
      'custom'
    ])
    .withMessage('Invalid report type'),
  body('dateRange.startDate')
    .isISO8601()
    .withMessage('Invalid start date format'),
  body('dateRange.endDate')
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.dateRange.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('chartType')
    .optional()
    .isIn(['pie', 'bar', 'line', 'doughnut', 'area'])
    .withMessage('Invalid chart type'),
  body('groupBy')
    .optional()
    .isIn(['category', 'date', 'payment_method', 'tag', 'month', 'week'])
    .withMessage('Invalid groupBy option'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Description cannot exceed 300 characters'),
  handleValidationErrors
];

// GET /api/reports - Get all user reports
router.get('/', auth, async (req, res) => {
  try {
    const { type, favorite, scheduled, page = 1, limit = 10 } = req.query;
    
    const filter = { userId: req.user.id };
    if (type) filter.type = type;
    if (favorite !== undefined) filter.isFavorite = favorite === 'true';
    if (scheduled !== undefined) filter.isScheduled = scheduled === 'true';
    
    const skip = (page - 1) * limit;
    
    const reports = await Report.find(filter)
      .populate('filters.categories', 'name color icon')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Report.countDocuments(filter);
    
    res.json({
      success: true,
      data: reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
});

// GET /api/reports/favorites - Get favorite reports
router.get('/favorites', auth, async (req, res) => {
  try {
    const reports = await Report.getFavoriteReports(req.user.id);
    
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching favorite reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorite reports',
      error: error.message
    });
  }
});

// GET /api/reports/scheduled - Get scheduled reports
router.get('/scheduled', auth, async (req, res) => {
  try {
    const reports = await Report.find({
      userId: req.user.id,
      isScheduled: true
    }).populate('filters.categories', 'name color icon');
    
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheduled reports',
      error: error.message
    });
  }
});

// GET /api/reports/type/:type - Get reports by type
router.get('/type/:type', auth, param('type').isIn([
  'expense_summary', 
  'category_breakdown', 
  'monthly_trends', 
  'budget_analysis', 
  'income_vs_expense',
  'payment_method_analysis',
  'spending_patterns',
  'budget_performance',
  'expense_forecasting',
  'top_expenses',
  'savings_analysis',
  'yearly_comparison',
  'quarterly_review',
  'weekly_spending',
  'custom'
]), handleValidationErrors, async (req, res) => {
  try {
    const reports = await Report.getReportsByType(req.user.id, req.params.type);
    
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching reports by type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports by type',
      error: error.message
    });
  }
});

// GET /api/reports/:id - Get specific report
router.get('/:id', auth, param('id').isMongoId(), handleValidationErrors, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('filters.categories', 'name color icon');
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
      error: error.message
    });
  }
});

// POST /api/reports - Create new report
router.post('/', auth, reportValidation, async (req, res) => {
  try {
    const reportData = {
      ...req.body,
      userId: req.user.id
    };
    
    const report = new Report(reportData);
    await report.save();
    
    const populatedReport = await Report.findById(report._id)
      .populate('filters.categories', 'name color icon');
    
    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: populatedReport
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create report',
      error: error.message
    });
  }
});

// PUT /api/reports/:id - Update report
router.put('/:id', auth, param('id').isMongoId(), reportValidation, async (req, res) => {
  try {
    const report = await Report.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('filters.categories', 'name color icon');
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report',
      error: error.message
    });
  }
});

// DELETE /api/reports/:id - Delete report
router.delete('/:id', auth, param('id').isMongoId(), handleValidationErrors, async (req, res) => {
  try {
    const report = await Report.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete report',
      error: error.message
    });
  }
});

// POST /api/reports/:id/generate - Generate report data
router.post('/:id/generate', auth, param('id').isMongoId(), handleValidationErrors, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    const reportData = await report.generateReportData();
    
    res.json({
      success: true,
      message: 'Report generated successfully',
      data: reportData
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
});

// PATCH /api/reports/:id/favorite - Toggle report favorite status
router.patch('/:id/favorite', auth, param('id').isMongoId(), handleValidationErrors, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    report.isFavorite = !report.isFavorite;
    await report.save();
    
    res.json({
      success: true,
      message: `Report ${report.isFavorite ? 'added to' : 'removed from'} favorites`,
      data: { isFavorite: report.isFavorite }
    });
  } catch (error) {
    console.error('Error toggling report favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle report favorite',
      error: error.message
    });
  }
});

// PATCH /api/reports/:id/schedule - Toggle report schedule
router.patch('/:id/schedule', auth, param('id').isMongoId(), handleValidationErrors, async (req, res) => {
  try {
    const { isScheduled, scheduleFrequency, emailRecipients } = req.body;
    
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    report.isScheduled = isScheduled;
    if (isScheduled) {
      if (!scheduleFrequency) {
        return res.status(400).json({
          success: false,
          message: 'Schedule frequency is required when scheduling a report'
        });
      }
      report.scheduleFrequency = scheduleFrequency;
      if (emailRecipients) report.emailRecipients = emailRecipients;
      report.scheduleNextRun();
    } else {
      report.scheduleFrequency = undefined;
      report.nextRunDate = undefined;
    }
    
    await report.save();
    
    res.json({
      success: true,
      message: `Report ${isScheduled ? 'scheduled' : 'unscheduled'} successfully`,
      data: {
        isScheduled: report.isScheduled,
        scheduleFrequency: report.scheduleFrequency,
        nextRunDate: report.nextRunDate
      }
    });
  } catch (error) {
    console.error('Error toggling report schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle report schedule',
      error: error.message
    });
  }
});

// POST /api/reports/quick-generate - Generate quick report without saving
router.post('/quick-generate', auth, async (req, res) => {
  try {
    const { type, dateRange, filters, chartType, groupBy } = req.body;
    
    if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Date range is required'
      });
    }
    
    // Create temporary report object for generation
    const tempReport = new Report({
      userId: req.user.id,
      name: 'Quick Report',
      type: type || 'expense_summary',
      dateRange,
      filters: filters || {},
      chartType: chartType || 'bar',
      groupBy: groupBy || 'category'
    });
    
    const reportData = await tempReport.generateReportData();
    
    res.json({
      success: true,
      message: 'Quick report generated successfully',
      data: reportData
    });
  } catch (error) {
    console.error('Error generating quick report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate quick report',
      error: error.message
    });
  }
});

// GET /api/reports/debug - Debug endpoint to check data
router.get('/debug', auth, async (req, res) => {
  try {
    // Import models properly
    const Expense = require('../models/Expense');
    const Category = require('../models/Category');
    
    console.log('Debug endpoint called for user:', req.user.id);
    
    const expenseCount = await Expense.countDocuments({ userId: req.user.id });
    const categoryCount = await Category.countDocuments({ userId: req.user.id });
    
    console.log('Counts found - Expenses:', expenseCount, 'Categories:', categoryCount);
    
    const recentExpenses = await Expense.find({ userId: req.user.id })
      .populate('categoryId', 'name color')
      .sort({ date: -1 })
      .limit(5);
    
    console.log('Recent expenses:', recentExpenses);
    
    res.json({
      success: true,
      data: {
        expenseCount,
        categoryCount,
        recentExpenses,
        userId: req.user.id
      }
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
});

// GET /api/reports/dashboard/summary - Get dashboard summary data
router.get('/dashboard/summary', auth, async (req, res) => {
  console.log('=== DASHBOARD SUMMARY ENDPOINT HIT ===');
  console.log('User ID:', req.user?.id);
  console.log('Query params:', req.query);
  
  try {
    const { period = 'monthly', startDate: customStartDate, endDate: customEndDate } = req.query;
    
    let startDate, endDate;
    const now = new Date();
    
    // Handle custom date range first
    if (period === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      console.log('Using custom date range:', { startDate, endDate });
    } else {
      // Use predefined periods
      switch (period) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'weekly':
          const weekStart = now.getDate() - now.getDay();
          startDate = new Date(now.getFullYear(), now.getMonth(), weekStart);
          endDate = new Date(now.getFullYear(), now.getMonth(), weekStart + 7);
          break;
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'lastMonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'last3Months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          endDate = now;
          break;
        case 'last6Months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          endDate = now;
          break;
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = now;
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear() + 1, 0, 1);
          break;
        case 'monthly':
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }
    }
    
    console.log('Dashboard summary called for user:', req.user.id);
    console.log('Date range:', { startDate, endDate });
    
    // Create temporary report for dashboard summary
    const tempReport = new Report({
      userId: req.user.id,
      name: 'Dashboard Summary',
      type: 'category_breakdown',
      dateRange: { startDate, endDate },
      chartType: 'pie',
      groupBy: 'category'
    });
    
    console.log('Generating report data...');
    const reportData = await tempReport.generateReportData();
    console.log('Generated report data:', JSON.stringify(reportData, null, 2));
    
    const responseData = {
      period,
      dateRange: { startDate, endDate },
      ...reportData
    };
    
    console.log('Sending response:', JSON.stringify(responseData, null, 2));
    
    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error generating dashboard summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard summary',
      error: error.message
    });
  }
});

module.exports = router;
