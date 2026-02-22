const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Report name is required'],
    trim: true,
    minlength: [3, 'Report name must be at least 3 characters long'],
    maxlength: [100, 'Report name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'Description cannot exceed 300 characters']
  },
  type: {
    type: String,
    enum: [
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
    ],
    required: [true, 'Report type is required'],
    default: 'expense_summary'
  },
  dateRange: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    }
  },
  filters: {
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }],
    paymentMethods: [{
      type: String,
      enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'other']
    }],
    amountRange: {
      min: {
        type: Number,
        min: 0
      },
      max: {
        type: Number,
        min: 0
      }
    },
    tags: [{
      type: String,
      trim: true
    }]
  },
  chartType: {
    type: String,
    enum: ['pie', 'bar', 'line', 'doughnut', 'area'],
    default: 'bar'
  },
  groupBy: {
    type: String,
    enum: ['category', 'date', 'payment_method', 'tag', 'month', 'week'],
    default: 'category'
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduleFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly'],
    required: function() {
      return this.isScheduled;
    }
  },
  nextRunDate: {
    type: Date,
    required: function() {
      return this.isScheduled;
    }
  },
  emailRecipients: [{
    type: String,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  lastGenerated: {
    type: Date,
    default: null
  },
  generationCount: {
    type: Number,
    default: 0
  },
  reportData: {
    summary: {
      totalExpenses: { type: Number, default: 0 },
      totalTransactions: { type: Number, default: 0 },
      averageExpense: { type: Number, default: 0 },
      highestExpense: { type: Number, default: 0 },
      lowestExpense: { type: Number, default: 0 }
    },
    chartData: {
      labels: [String],
      datasets: [{
        label: String,
        data: [Number],
        backgroundColor: [String],
        borderColor: [String]
      }]
    },
    tableData: [{
      date: Date,
      description: String,
      category: String,
      amount: Number,
      paymentMethod: String
    }]
  },
  settings: {
    currency: {
      type: String,
      default: 'USD'
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY'
    },
    includeSubcategories: {
      type: Boolean,
      default: true
    },
    showPercentages: {
      type: Boolean,
      default: true
    },
    showTrends: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for date range duration in days
reportSchema.virtual('durationDays').get(function() {
  const start = new Date(this.dateRange.startDate);
  const end = new Date(this.dateRange.endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for report status
reportSchema.virtual('status').get(function() {
  if (!this.lastGenerated) return 'never_generated';
  
  const now = new Date();
  const lastGen = new Date(this.lastGenerated);
  const hoursSinceGeneration = (now - lastGen) / (1000 * 60 * 60);
  
  if (hoursSinceGeneration < 1) return 'fresh';
  if (hoursSinceGeneration < 24) return 'recent';
  return 'stale';
});

// Indexes for better query performance
reportSchema.index({ userId: 1, type: 1 });
reportSchema.index({ userId: 1, isFavorite: 1 });
reportSchema.index({ userId: 1, isScheduled: 1 });
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ nextRunDate: 1, isScheduled: 1 });

// Pre-save middleware to set next run date for scheduled reports
reportSchema.pre('save', function(next) {
  if (this.isScheduled && (!this.nextRunDate || this.isModified('scheduleFrequency'))) {
    const now = new Date();
    
    switch (this.scheduleFrequency) {
      case 'daily':
        this.nextRunDate = new Date(now.getTime() + (24 * 60 * 60 * 1000));
        break;
      case 'weekly':
        this.nextRunDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
        break;
      case 'monthly':
        this.nextRunDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        break;
      case 'quarterly':
        this.nextRunDate = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
        break;
    }
  }
  next();
});

// Static method to get user's favorite reports
reportSchema.statics.getFavoriteReports = function(userId) {
  return this.find({ 
    userId: new mongoose.Types.ObjectId(userId), 
    isFavorite: true 
  }).sort({ updatedAt: -1 });
};

// Static method to get scheduled reports due for generation
reportSchema.statics.getScheduledReportsDue = function() {
  return this.find({
    isScheduled: true,
    nextRunDate: { $lte: new Date() }
  }).populate('userId', 'name email');
};

// Static method to get reports by type
reportSchema.statics.getReportsByType = function(userId, type) {
  return this.find({ 
    userId: new mongoose.Types.ObjectId(userId),
    type: type 
  }).sort({ createdAt: -1 });
};

// Instance method to generate report data
reportSchema.methods.generateReportData = async function() {
  const Expense = mongoose.model('Expense');
  const Category = mongoose.model('Category');
  const Budget = mongoose.model('Budget');
  
  try {
    // Build match conditions
    const matchConditions = {
      userId: this.userId,
      date: {
        $gte: this.dateRange.startDate,
        $lte: this.dateRange.endDate
      }
    };
    
    // Apply filters
    if (this.filters.categories && this.filters.categories.length > 0) {
      matchConditions.categoryId = { $in: this.filters.categories };
    }
    
    if (this.filters.paymentMethods && this.filters.paymentMethods.length > 0) {
      matchConditions.paymentMethod = { $in: this.filters.paymentMethods };
    }
    
    if (this.filters.amountRange && (this.filters.amountRange.min || this.filters.amountRange.max)) {
      matchConditions.amount = {};
      if (this.filters.amountRange.min) matchConditions.amount.$gte = this.filters.amountRange.min;
      if (this.filters.amountRange.max) matchConditions.amount.$lte = this.filters.amountRange.max;
    }
    
    if (this.filters.tags && this.filters.tags.length > 0) {
      matchConditions.tags = { $in: this.filters.tags };
    }
    
    // Generate report data based on type
    let reportData = {};
    
    switch (this.type) {
      case 'expense_summary':
        reportData = await this.generateExpenseSummary(matchConditions);
        break;
      case 'category_breakdown':
        reportData = await this.generateCategoryBreakdown(matchConditions);
        break;
      case 'monthly_trends':
        reportData = await this.generateMonthlyTrends(matchConditions);
        break;
      case 'budget_analysis':
        reportData = await this.generateBudgetAnalysis(matchConditions);
        break;
      case 'income_vs_expense':
        reportData = await this.generateIncomeVsExpense(matchConditions);
        break;
      case 'payment_method_analysis':
        reportData = await this.generatePaymentMethodAnalysis(matchConditions);
        break;
      case 'spending_patterns':
        reportData = await this.generateSpendingPatterns(matchConditions);
        break;
      case 'budget_performance':
        reportData = await this.generateBudgetPerformance(matchConditions);
        break;
      case 'top_expenses':
        reportData = await this.generateTopExpenses(matchConditions);
        break;
      case 'savings_analysis':
        reportData = await this.generateSavingsAnalysis(matchConditions);
        break;
      case 'yearly_comparison':
        reportData = await this.generateYearlyComparison(matchConditions);
        break;
      case 'quarterly_review':
        reportData = await this.generateQuarterlyReview(matchConditions);
        break;
      case 'weekly_spending':
        reportData = await this.generateWeeklySpending(matchConditions);
        break;
      default:
        reportData = await this.generateExpenseSummary(matchConditions);
    }
    
    // Update report data
    this.reportData = reportData;
    this.lastGenerated = new Date();
    this.generationCount += 1;
    
    await this.save();
    
    return this.reportData;
    
  } catch (error) {
    console.error('Error generating report data:', error);
    throw error;
  }
};

// Individual report generation methods
reportSchema.methods.generateExpenseSummary = async function(matchConditions) {
  const Expense = mongoose.model('Expense');
  
  const summaryResult = await Expense.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        averageExpense: { $avg: '$amount' },
        highestExpense: { $max: '$amount' },
        lowestExpense: { $min: '$amount' }
      }
    }
  ]);
  
  const summary = summaryResult[0] || {
    totalExpenses: 0,
    totalTransactions: 0,
    averageExpense: 0,
    highestExpense: 0,
    lowestExpense: 0
  };
  
  // Get recent expenses for table
  const expenses = await Expense.find(matchConditions)
    .populate('categoryId', 'name')
    .sort({ date: -1 })
    .limit(50);
  
  const tableData = expenses.map(expense => ({
    date: expense.date,
    description: expense.description,
    category: expense.categoryId?.name || 'Uncategorized',
    amount: expense.amount,
    paymentMethod: expense.paymentMethod
  }));
  
  return { summary, chartData: { labels: [], datasets: [] }, tableData };
};

reportSchema.methods.generateCategoryBreakdown = async function(matchConditions) {
  const Expense = mongoose.model('Expense');
  
  console.log('Generating category breakdown with conditions:', matchConditions);
  
  // First check if there are any expenses at all
  const totalExpenses = await Expense.countDocuments(matchConditions);
  console.log('Total expenses found:', totalExpenses);
  
  if (totalExpenses === 0) {
    console.log('No expenses found, returning empty data');
    return {
      summary: {
        totalExpenses: 0,
        totalTransactions: 0,
        categoriesCount: 0,
        topCategory: 'No expenses',
        averageExpense: 0
      },
      chartData: { labels: [], datasets: [] },
      tableData: []
    };
  }
  
  // Try a simpler query first to see if we can get any data
  const simpleExpenses = await Expense.find(matchConditions).populate('categoryId', 'name color').limit(5);
  console.log('Simple expense query result:', simpleExpenses.map(e => ({
    amount: e.amount,
    description: e.description,
    categoryId: e.categoryId?._id,
    categoryName: e.categoryId?.name,
    categoryColor: e.categoryId?.color
  })));
  
  let categoryData = [];
  
  try {
    // Convert categoryId strings to ObjectId for proper lookup
    const pipeline = [
      { $match: matchConditions },
      {
        $addFields: {
          categoryObjectId: { 
            $cond: {
              if: { $type: "$categoryId" },
              then: { $toObjectId: "$categoryId" },
              else: "$categoryId"
            }
          }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryObjectId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$categoryObjectId',
          name: { $first: { $ifNull: ['$category.name', 'Uncategorized'] } },
          color: { $first: { $ifNull: ['$category.color', '#9E9E9E'] } },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ];
    
    console.log('Running aggregation pipeline:', JSON.stringify(pipeline, null, 2));
    categoryData = await Expense.aggregate(pipeline);
    
    console.log('Category aggregation result:', categoryData);
  } catch (aggregationError) {
    console.error('Aggregation failed, trying fallback approach:', aggregationError);
    
    // Fallback: Get expenses and manually group by category
    const expenses = await Expense.find(matchConditions).populate('categoryId', 'name color');
    console.log('Fallback expenses found:', expenses.length);
    console.log('Sample expense with category:', expenses[0] ? {
      description: expenses[0].description,
      amount: expenses[0].amount,
      categoryId: expenses[0].categoryId?._id,
      categoryName: expenses[0].categoryId?.name,
      categoryColor: expenses[0].categoryId?.color
    } : 'No expenses found');
    
    const categoryMap = new Map();
    let totalAmount = 0;
    
    expenses.forEach(expense => {
      totalAmount += expense.amount;
      const categoryId = expense.categoryId?._id?.toString() || 'uncategorized';
      const categoryName = expense.categoryId?.name || 'Uncategorized';
      const categoryColor = expense.categoryId?.color || '#9E9E9E';
      
      console.log('Processing expense:', {
        amount: expense.amount,
        description: expense.description,
        categoryId: categoryId,
        categoryName: categoryName,
        hasCategory: !!expense.categoryId
      });
      
      if (categoryMap.has(categoryId)) {
        const existing = categoryMap.get(categoryId);
        existing.totalAmount += expense.amount;
        existing.count += 1;
        existing.averageAmount = existing.totalAmount / existing.count;
      } else {
        categoryMap.set(categoryId, {
          _id: categoryId,
          name: categoryName,
          color: categoryColor,
          totalAmount: expense.amount,
          count: 1,
          averageAmount: expense.amount
        });
      }
    });
    
    categoryData = Array.from(categoryMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
    console.log('Fallback category data:', categoryData);
  }
  
  // Ensure we have valid category data
  if (!categoryData || categoryData.length === 0) {
    console.log('No category data found, returning empty result');
    return {
      summary: {
        totalExpenses: 0,
        totalTransactions: 0,
        averageExpense: 0,
        categoriesCount: 0,
        topCategory: 'No expenses'
      },
      chartData: { labels: [], datasets: [] },
      tableData: []
    };
  }
  
  const chartData = {
    labels: categoryData.map(item => item.name),
    datasets: [{
      label: 'Amount by Category',
      data: categoryData.map(item => item.totalAmount),
      backgroundColor: categoryData.map(item => item.color),
      borderColor: categoryData.map(item => item.color)
    }]
  };
  
  const totalAmount = categoryData.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalCount = categoryData.reduce((sum, item) => sum + item.count, 0);
  
  // Ensure tableData has complete information
  const completeTableData = categoryData.map(item => ({
    _id: item._id,
    name: item.name,
    color: item.color,
    totalAmount: item.totalAmount,
    count: item.count,
    averageAmount: item.averageAmount
  }));

  const summary = {
    totalExpenses: totalAmount,
    totalTransactions: totalCount,
    averageExpense: totalCount > 0 ? totalAmount / totalCount : 0,
    categoriesCount: categoryData.length,
    topCategory: categoryData[0]?.name || 'No expenses'
  };
  
  console.log('Generated summary:', summary);
  console.log('Complete table data:', completeTableData);
  
  return { summary, chartData, tableData: completeTableData };
};

reportSchema.methods.generateMonthlyTrends = async function(matchConditions) {
  const Expense = mongoose.model('Expense');
  
  const monthlyData = await Expense.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  
  const chartData = {
    labels: monthlyData.map(item => `${item._id.year}-${String(item._id.month).padStart(2, '0')}`),
    datasets: [{
      label: 'Monthly Expenses',
      data: monthlyData.map(item => item.totalAmount),
      backgroundColor: '#2196F3',
      borderColor: '#2196F3',
      fill: false
    }]
  };
  
  const summary = {
    totalMonths: monthlyData.length,
    averageMonthlyExpense: monthlyData.reduce((sum, item) => sum + item.totalAmount, 0) / monthlyData.length || 0,
    highestMonth: monthlyData.reduce((max, item) => item.totalAmount > max.totalAmount ? item : max, monthlyData[0] || {}),
    lowestMonth: monthlyData.reduce((min, item) => item.totalAmount < min.totalAmount ? item : min, monthlyData[0] || {})
  };
  
  return { summary, chartData, tableData: monthlyData };
};

reportSchema.methods.generateBudgetAnalysis = async function(matchConditions) {
  const Expense = mongoose.model('Expense');
  const Budget = mongoose.model('Budget');
  
  const budgets = await Budget.find({ userId: this.userId });
  const budgetAnalysis = [];
  
  for (const budget of budgets) {
    const spent = await Expense.aggregate([
      {
        $match: {
          ...matchConditions,
          categoryId: budget.categoryId
        }
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$amount' }
        }
      }
    ]);
    
    const totalSpent = spent[0]?.totalSpent || 0;
    const remaining = budget.amount - totalSpent;
    const percentageUsed = (totalSpent / budget.amount) * 100;
    
    budgetAnalysis.push({
      budgetName: budget.name,
      budgetAmount: budget.amount,
      spent: totalSpent,
      remaining: remaining,
      percentageUsed: percentageUsed,
      status: percentageUsed > 100 ? 'over' : percentageUsed > 80 ? 'warning' : 'good'
    });
  }
  
  const chartData = {
    labels: budgetAnalysis.map(item => item.budgetName),
    datasets: [{
      label: 'Budget vs Spent',
      data: budgetAnalysis.map(item => item.percentageUsed),
      backgroundColor: budgetAnalysis.map(item => 
        item.status === 'over' ? '#F44336' : 
        item.status === 'warning' ? '#FF9800' : '#4CAF50'
      )
    }]
  };
  
  return { summary: { budgetsCount: budgets.length }, chartData, tableData: budgetAnalysis };
};

reportSchema.methods.generatePaymentMethodAnalysis = async function(matchConditions) {
  const Expense = mongoose.model('Expense');
  
  const paymentData = await Expense.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$paymentMethod',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
  
  const chartData = {
    labels: paymentData.map(item => item._id || 'Unknown'),
    datasets: [{
      label: 'Amount by Payment Method',
      data: paymentData.map(item => item.totalAmount),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
    }]
  };
  
  return { 
    summary: { 
      totalPaymentMethods: paymentData.length,
      mostUsedMethod: paymentData[0]?._id || 'None'
    }, 
    chartData, 
    tableData: paymentData 
  };
};

reportSchema.methods.generateTopExpenses = async function(matchConditions) {
  const Expense = mongoose.model('Expense');
  
  const topExpenses = await Expense.find(matchConditions)
    .populate('categoryId', 'name color')
    .sort({ amount: -1 })
    .limit(20);
  
  const tableData = topExpenses.map(expense => ({
    date: expense.date,
    description: expense.description,
    category: expense.categoryId?.name || 'Uncategorized',
    amount: expense.amount,
    paymentMethod: expense.paymentMethod
  }));
  
  const chartData = {
    labels: topExpenses.slice(0, 10).map(expense => expense.description.substring(0, 20)),
    datasets: [{
      label: 'Top Expenses',
      data: topExpenses.slice(0, 10).map(expense => expense.amount),
      backgroundColor: '#FF6384'
    }]
  };
  
  return { 
    summary: { 
      highestExpense: topExpenses[0]?.amount || 0,
      averageTopExpense: topExpenses.reduce((sum, exp) => sum + exp.amount, 0) / topExpenses.length || 0
    }, 
    chartData, 
    tableData 
  };
};

reportSchema.methods.generateWeeklySpending = async function(matchConditions) {
  const Expense = mongoose.model('Expense');
  
  const weeklyData = await Expense.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          week: { $week: '$date' }
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } }
  ]);
  
  const chartData = {
    labels: weeklyData.map(item => `Week ${item._id.week}, ${item._id.year}`),
    datasets: [{
      label: 'Weekly Spending',
      data: weeklyData.map(item => item.totalAmount),
      backgroundColor: '#4CAF50',
      borderColor: '#4CAF50'
    }]
  };
  
  return { 
    summary: { 
      totalWeeks: weeklyData.length,
      averageWeeklySpending: weeklyData.reduce((sum, item) => sum + item.totalAmount, 0) / weeklyData.length || 0
    }, 
    chartData, 
    tableData: weeklyData 
  };
};

reportSchema.methods.generateIncomeVsExpense = async function(matchConditions) {
  const Expense = mongoose.model('Expense');
  
  // Get expense data
  const expenseData = await Expense.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        totalExpenses: { $sum: '$amount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  
  // For now, we'll simulate income data (in a real app, you'd have an Income model)
  const incomeData = expenseData.map(item => ({
    ...item,
    totalIncome: item.totalExpenses * 1.2 // Simulate 20% more income than expenses
  }));
  
  const chartData = {
    labels: expenseData.map(item => `${item._id.year}-${String(item._id.month).padStart(2, '0')}`),
    datasets: [
      {
        label: 'Income',
        data: incomeData.map(item => item.totalIncome),
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50'
      },
      {
        label: 'Expenses',
        data: expenseData.map(item => item.totalExpenses),
        backgroundColor: '#F44336',
        borderColor: '#F44336'
      }
    ]
  };
  
  const totalIncome = incomeData.reduce((sum, item) => sum + item.totalIncome, 0);
  const totalExpenses = expenseData.reduce((sum, item) => sum + item.totalExpenses, 0);
  
  return {
    summary: {
      totalIncome: totalIncome,
      totalExpenses: totalExpenses,
      netSavings: totalIncome - totalExpenses,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
    },
    chartData,
    tableData: incomeData.map((item, index) => ({
      period: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      income: item.totalIncome,
      expenses: expenseData[index].totalExpenses,
      savings: item.totalIncome - expenseData[index].totalExpenses
    }))
  };
};

reportSchema.methods.generateSpendingPatterns = async function(matchConditions) {
  const Expense = mongoose.model('Expense');
  
  const dailySpending = await Expense.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: {
          dayOfWeek: { $dayOfWeek: '$date' },
          hour: { $hour: '$date' }
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } }
  ]);
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const chartData = {
    labels: dailySpending.map(item => `${dayNames[item._id.dayOfWeek - 1]} ${item._id.hour}:00`),
    datasets: [{
      label: 'Spending Patterns',
      data: dailySpending.map(item => item.totalAmount),
      backgroundColor: '#2196F3',
      borderColor: '#2196F3'
    }]
  };
  
  return {
    summary: {
      totalPatterns: dailySpending.length,
      peakSpendingDay: dayNames[dailySpending.reduce((max, item) => item.totalAmount > max.totalAmount ? item : max, dailySpending[0] || {})._id?.dayOfWeek - 1] || 'None'
    },
    chartData,
    tableData: dailySpending
  };
};

reportSchema.methods.generateSavingsAnalysis = async function(matchConditions) {
  const Expense = mongoose.model('Expense');
  
  const monthlyExpenses = await Expense.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        totalExpenses: { $sum: '$amount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  
  // Simulate savings goals and achievements
  const savingsData = monthlyExpenses.map(item => {
    const simulatedIncome = item.totalExpenses * 1.3;
    const actualSavings = simulatedIncome - item.totalExpenses;
    const savingsGoal = simulatedIncome * 0.2; // 20% savings goal
    
    return {
      period: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      income: simulatedIncome,
      expenses: item.totalExpenses,
      actualSavings: actualSavings,
      savingsGoal: savingsGoal,
      goalAchieved: actualSavings >= savingsGoal
    };
  });
  
  const chartData = {
    labels: savingsData.map(item => item.period),
    datasets: [
      {
        label: 'Actual Savings',
        data: savingsData.map(item => item.actualSavings),
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50'
      },
      {
        label: 'Savings Goal',
        data: savingsData.map(item => item.savingsGoal),
        backgroundColor: '#FF9800',
        borderColor: '#FF9800'
      }
    ]
  };
  
  return {
    summary: {
      totalSavings: savingsData.reduce((sum, item) => sum + item.actualSavings, 0),
      averageSavingsRate: savingsData.reduce((sum, item) => sum + (item.actualSavings / item.income), 0) / savingsData.length * 100 || 0,
      goalsAchieved: savingsData.filter(item => item.goalAchieved).length
    },
    chartData,
    tableData: savingsData
  };
};

reportSchema.methods.generateYearlyComparison = async function(matchConditions) {
  const Expense = mongoose.model('Expense');
  
  const yearlyData = await Expense.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: { $year: '$date' },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
  
  const chartData = {
    labels: yearlyData.map(item => item._id.toString()),
    datasets: [{
      label: 'Yearly Expenses',
      data: yearlyData.map(item => item.totalAmount),
      backgroundColor: '#9C27B0',
      borderColor: '#9C27B0'
    }]
  };
  
  return {
    summary: {
      totalYears: yearlyData.length,
      averageYearlySpending: yearlyData.reduce((sum, item) => sum + item.totalAmount, 0) / yearlyData.length || 0,
      highestYear: yearlyData.reduce((max, item) => item.totalAmount > max.totalAmount ? item : max, yearlyData[0] || {})._id || 'None'
    },
    chartData,
    tableData: yearlyData
  };
};

reportSchema.methods.generateQuarterlyReview = async function(matchConditions) {
  const Expense = mongoose.model('Expense');
  
  const quarterlyData = await Expense.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          quarter: {
            $ceil: { $divide: [{ $month: '$date' }, 3] }
          }
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.quarter': 1 } }
  ]);
  
  const chartData = {
    labels: quarterlyData.map(item => `Q${item._id.quarter} ${item._id.year}`),
    datasets: [{
      label: 'Quarterly Expenses',
      data: quarterlyData.map(item => item.totalAmount),
      backgroundColor: '#FF5722',
      borderColor: '#FF5722'
    }]
  };
  
  return {
    summary: {
      totalQuarters: quarterlyData.length,
      averageQuarterlySpending: quarterlyData.reduce((sum, item) => sum + item.totalAmount, 0) / quarterlyData.length || 0,
      bestQuarter: quarterlyData.reduce((min, item) => item.totalAmount < min.totalAmount ? item : min, quarterlyData[0] || {})
    },
    chartData,
    tableData: quarterlyData
  };
};

// Instance method to schedule next run
reportSchema.methods.scheduleNextRun = function() {
  if (!this.isScheduled) return;
  
  const now = new Date();
  
  switch (this.scheduleFrequency) {
    case 'daily':
      this.nextRunDate = new Date(now.getTime() + (24 * 60 * 60 * 1000));
      break;
    case 'weekly':
      this.nextRunDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
      break;
    case 'monthly':
      this.nextRunDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      break;
    case 'quarterly':
      this.nextRunDate = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      break;
  }
};

module.exports = mongoose.model('Report', reportSchema);
