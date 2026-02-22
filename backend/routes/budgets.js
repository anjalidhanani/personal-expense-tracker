const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const { authenticate: auth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { body, param, query } = require('express-validator');

// Validation rules for budget creation/update
const budgetValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Budget name must be between 3 and 50 characters'),
  body('categoryId')
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('amount')
    .isFloat({ min: 1, max: 10000000 })
    .withMessage('Budget amount must be between 1 and 10,000,000'),
  body('period')
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Period must be daily, weekly, monthly, or yearly'),
  body('alertThreshold')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Alert threshold must be between 0 and 100'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  handleValidationErrors
];

// GET /api/budgets - Get all user budgets
router.get('/', auth, async (req, res) => {
  try {
    const { period, active, page = 1, limit = 10 } = req.query;
    
    const filter = { userId: req.user.id };
    if (period) filter.period = period;
    if (active !== undefined) filter.isActive = active === 'true';
    
    const skip = (page - 1) * limit;
    
    const budgets = await Budget.find(filter)
      .populate('categoryId', 'name color icon')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Calculate spent amounts for each budget
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spentAmount = await budget.calculateSpentAmount();
        console.log(`Budget "${budget.name}" (${budget._id}): categoryId=${budget.categoryId}, startDate=${budget.startDate}, endDate=${budget.endDate}, spentAmount=${spentAmount}`);
        return {
          ...budget.toObject(),
          spentAmount,
          remainingAmount: budget.amount - spentAmount,
          percentageUsed: budget.amount > 0 ? Math.round((spentAmount / budget.amount) * 100) : 0
        };
      })
    );
    
    const total = await Budget.countDocuments(filter);
    
    res.json({
      success: true,
      data: budgetsWithSpent,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budgets',
      error: error.message
    });
  }
});

// GET /api/budgets/active - Get active budgets
router.get('/active', auth, async (req, res) => {
  try {
    const budgets = await Budget.getActiveBudgets(req.user.id);
    
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spentAmount = await budget.calculateSpentAmount();
        return {
          ...budget.toObject(),
          spentAmount,
          remainingAmount: budget.amount - spentAmount,
          percentageUsed: budget.amount > 0 ? Math.round((spentAmount / budget.amount) * 100) : 0
        };
      })
    );
    
    res.json({
      success: true,
      data: budgetsWithSpent
    });
  } catch (error) {
    console.error('Error fetching active budgets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active budgets',
      error: error.message
    });
  }
});

// GET /api/budgets/alerts - Get budget alerts
router.get('/alerts', auth, async (req, res) => {
  try {
    const alerts = await Budget.checkBudgetAlerts(req.user.id);
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching budget alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget alerts',
      error: error.message
    });
  }
});

// GET /api/budgets/:id - Get specific budget
router.get('/:id', auth, param('id').isMongoId(), handleValidationErrors, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('categoryId', 'name color icon');
    
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }
    
    const spentAmount = await budget.calculateSpentAmount();
    const budgetWithSpent = {
      ...budget.toObject(),
      spentAmount,
      remainingAmount: budget.amount - spentAmount,
      percentageUsed: budget.amount > 0 ? Math.round((spentAmount / budget.amount) * 100) : 0
    };
    
    res.json({
      success: true,
      data: budgetWithSpent
    });
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget',
      error: error.message
    });
  }
});

// POST /api/budgets - Create new budget
router.post('/', auth, budgetValidation, async (req, res) => {
  try {
    const budgetData = {
      ...req.body,
      userId: req.user.id
    };
    
    const budget = new Budget(budgetData);
    await budget.save();
    
    const populatedBudget = await Budget.findById(budget._id)
      .populate('categoryId', 'name color icon');
    
    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: populatedBudget
    });
  } catch (error) {
    console.error('Error creating budget:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A budget for this category and period already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create budget',
      error: error.message
    });
  }
});

// PUT /api/budgets/:id - Update budget
router.put('/:id', auth, param('id').isMongoId(), budgetValidation, async (req, res) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name color icon');
    
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Budget updated successfully',
      data: budget
    });
  } catch (error) {
    console.error('Error updating budget:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A budget for this category and period already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update budget',
      error: error.message
    });
  }
});

// DELETE /api/budgets/:id - Delete budget
router.delete('/:id', auth, param('id').isMongoId(), handleValidationErrors, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete budget',
      error: error.message
    });
  }
});

// PATCH /api/budgets/:id/toggle - Toggle budget active status
router.patch('/:id/toggle', auth, param('id').isMongoId(), handleValidationErrors, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }
    
    budget.isActive = !budget.isActive;
    await budget.save();
    
    res.json({
      success: true,
      message: `Budget ${budget.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: budget.isActive }
    });
  } catch (error) {
    console.error('Error toggling budget status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle budget status',
      error: error.message
    });
  }
});

// GET /api/budgets/period/:period - Get budgets by period
router.get('/period/:period', auth, param('period').isIn(['daily', 'weekly', 'monthly', 'yearly']), handleValidationErrors, async (req, res) => {
  try {
    const budgets = await Budget.getBudgetsByPeriod(req.user.id, req.params.period);
    
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spentAmount = await budget.calculateSpentAmount();
        return {
          ...budget.toObject(),
          spentAmount,
          remainingAmount: budget.amount - spentAmount,
          percentageUsed: budget.amount > 0 ? Math.round((spentAmount / budget.amount) * 100) : 0
        };
      })
    );
    
    res.json({
      success: true,
      data: budgetsWithSpent
    });
  } catch (error) {
    console.error('Error fetching budgets by period:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budgets by period',
      error: error.message
    });
  }
});

module.exports = router;
