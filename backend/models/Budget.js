const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Budget name is required'],
    trim: true,
    minlength: [3, 'Budget name must be at least 3 characters long'],
    maxlength: [50, 'Budget name cannot exceed 50 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [1, 'Budget amount must be greater than 0'],
    max: [10000000, 'Budget amount cannot exceed 10,000,000']
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: [true, 'Budget period is required'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  alertThreshold: {
    type: Number,
    min: [0, 'Alert threshold cannot be negative'],
    max: [100, 'Alert threshold cannot exceed 100%'],
    default: 80 // Alert when 80% of budget is used
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for spent amount (calculated from expenses)
budgetSchema.virtual('spentAmount', {
  ref: 'Expense',
  localField: '_id',
  foreignField: 'budgetId',
  justOne: false
});

// Virtual for remaining amount
budgetSchema.virtual('remainingAmount').get(function() {
  return this.amount - (this.spentAmount || 0);
});

// Virtual for percentage used
budgetSchema.virtual('percentageUsed').get(function() {
  const spent = this.spentAmount || 0;
  return this.amount > 0 ? Math.round((spent / this.amount) * 100) : 0;
});

// Virtual for budget status
budgetSchema.virtual('status').get(function() {
  const percentage = this.percentageUsed;
  if (percentage >= 100) return 'exceeded';
  if (percentage >= this.alertThreshold) return 'warning';
  return 'on_track';
});

// Virtual for days remaining
budgetSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Compound indexes for better query performance
budgetSchema.index({ userId: 1, categoryId: 1 });
budgetSchema.index({ userId: 1, isActive: 1 });
budgetSchema.index({ userId: 1, period: 1 });
budgetSchema.index({ endDate: 1, isActive: 1 });

// Ensure unique budget per user per category per period
budgetSchema.index({ 
  userId: 1, 
  categoryId: 1, 
  period: 1,
  startDate: 1 
}, { 
  unique: true,
  partialFilterExpression: { isActive: true }
});

// Pre-save middleware to set end date based on period
budgetSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('startDate') || this.isModified('period')) {
    const start = new Date(this.startDate);
    
    switch (this.period) {
      case 'daily':
        this.endDate = new Date(start.getTime() + (24 * 60 * 60 * 1000));
        break;
      case 'weekly':
        this.endDate = new Date(start.getTime() + (7 * 24 * 60 * 60 * 1000));
        break;
      case 'monthly':
        this.endDate = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
        break;
      case 'yearly':
        this.endDate = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
        break;
    }
  }
  next();
});

// Static method to get user's active budgets
budgetSchema.statics.getActiveBudgets = function(userId) {
  return this.find({ 
    userId: new mongoose.Types.ObjectId(userId), 
    isActive: true,
    endDate: { $gte: new Date() }
  }).populate('categoryId', 'name color icon');
};

// Static method to get budgets by period
budgetSchema.statics.getBudgetsByPeriod = function(userId, period) {
  return this.find({ 
    userId: new mongoose.Types.ObjectId(userId),
    period: period,
    isActive: true 
  }).populate('categoryId', 'name color icon');
};

// Static method to check budget alerts
budgetSchema.statics.checkBudgetAlerts = async function(userId) {
  const budgets = await this.getActiveBudgets(userId);
  const alerts = [];
  
  for (const budget of budgets) {
    if (budget.percentageUsed >= budget.alertThreshold) {
      alerts.push({
        budgetId: budget._id,
        budgetName: budget.name,
        category: budget.categoryId.name,
        percentageUsed: budget.percentageUsed,
        status: budget.status,
        remainingAmount: budget.remainingAmount
      });
    }
  }
  
  return alerts;
};

// Instance method to calculate spent amount
budgetSchema.methods.calculateSpentAmount = async function() {
  const Expense = mongoose.model('Expense');
  
  // Get the raw categoryId (in case it's populated)
  const categoryId = this.categoryId._id || this.categoryId;
  const userId = this.userId._id || this.userId;
  
  console.log(`Calculating spent amount for budget "${this.name}"`);
  console.log(`  Budget userId: ${userId} (type: ${typeof userId})`);
  console.log(`  Budget categoryId: ${categoryId} (type: ${typeof categoryId})`);
  console.log(`  Budget date range: ${this.startDate} to ${this.endDate}`);
  
  // Convert to ObjectId for proper comparison
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const categoryObjectId = new mongoose.Types.ObjectId(categoryId);
  
  console.log(`  Converted userId: ${userObjectId}`);
  console.log(`  Converted categoryId: ${categoryObjectId}`);
  
  // First, let's see what expenses exist for this user and category
  const allExpenses = await Expense.find({
    userId: userObjectId,
    categoryId: categoryObjectId
  });
  
  console.log(`  Found ${allExpenses.length} total expenses for this user/category`);
  allExpenses.forEach(expense => {
    console.log(`    Expense: ${expense.amount} on ${expense.date} (in range: ${expense.date >= this.startDate && expense.date <= this.endDate})`);
  });
  
  // Also check for expenses with any categoryId to see if there's a mismatch
  const allUserExpenses = await Expense.find({ userId: userObjectId });
  console.log(`  Found ${allUserExpenses.length} total expenses for this user (any category)`);
  allUserExpenses.forEach(expense => {
    console.log(`    User expense: categoryId=${expense.categoryId}, amount=${expense.amount}, date=${expense.date}`);
  });
  
  const result = await Expense.aggregate([
    {
      $match: {
        userId: userObjectId,
        categoryId: categoryObjectId,
        date: {
          $gte: this.startDate,
          $lte: this.endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: '$amount' }
      }
    }
  ]);
  
  console.log(`  Aggregation result:`, result);
  
  const spentAmount = result.length > 0 ? result[0].totalSpent : 0;
  console.log(`  Calculated spent amount: ${spentAmount}`);
  
  return spentAmount;
};

module.exports = mongoose.model('Budget', budgetSchema);
