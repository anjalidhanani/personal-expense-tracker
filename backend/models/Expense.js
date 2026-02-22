const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
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
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
    max: [1000000, 'Amount cannot exceed 1,000,000']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [3, 'Description must be at least 3 characters long'],
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now,
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'other'],
    default: 'cash'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  receipt: {
    type: String, // URL or file path for receipt image
    default: ''
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: function() {
      return this.isRecurring;
    }
  },
  nextRecurringDate: {
    type: Date,
    required: function() {
      return this.isRecurring;
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, categoryId: 1 });
expenseSchema.index({ userId: 1, createdAt: -1 });
expenseSchema.index({ date: 1, userId: 1 });

// Virtual for formatted amount
expenseSchema.virtual('formattedAmount').get(function() {
  return this.amount.toFixed(2);
});

// Virtual for month/year
expenseSchema.virtual('monthYear').get(function() {
  const date = new Date(this.date);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
});

// Static method to get user's total expenses
expenseSchema.statics.getUserTotalExpenses = function(userId, startDate, endDate) {
  const matchConditions = { userId: new mongoose.Types.ObjectId(userId) };
  
  if (startDate || endDate) {
    matchConditions.date = {};
    if (startDate) matchConditions.date.$gte = new Date(startDate);
    if (endDate) matchConditions.date.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get category-wise expenses
expenseSchema.statics.getCategoryWiseExpenses = function(userId, startDate, endDate) {
  const matchConditions = { userId: new mongoose.Types.ObjectId(userId) };
  
  if (startDate || endDate) {
    matchConditions.date = {};
    if (startDate) matchConditions.date.$gte = new Date(startDate);
    if (endDate) matchConditions.date.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchConditions },
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
        name: { $first: '$category.name' },
        color: { $first: '$category.color' },
        icon: { $first: '$category.icon' },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
};

// Static method to get monthly expenses
expenseSchema.statics.getMonthlyExpenses = function(userId, year) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);

  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $group: {
        _id: {
          month: { $month: '$date' },
          year: { $year: '$date' }
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.month': 1 } }
  ]);
};

// Static method to get recent expenses
expenseSchema.statics.getRecentExpenses = function(userId, limit = 10) {
  return this.find({ userId })
    .populate('categoryId', 'name color icon')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Pre-save middleware to handle recurring expenses
expenseSchema.pre('save', function(next) {
  if (this.isRecurring && !this.nextRecurringDate) {
    const currentDate = new Date(this.date);
    
    switch (this.recurringPattern) {
      case 'daily':
        this.nextRecurringDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
        break;
      case 'weekly':
        this.nextRecurringDate = new Date(currentDate.setDate(currentDate.getDate() + 7));
        break;
      case 'monthly':
        this.nextRecurringDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
        break;
      case 'yearly':
        this.nextRecurringDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
        break;
    }
  }
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);
