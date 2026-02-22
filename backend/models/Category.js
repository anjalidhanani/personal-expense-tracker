const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    minlength: [2, 'Category name must be at least 2 characters long'],
    maxlength: [30, 'Category name cannot exceed 30 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  icon: {
    type: String,
    default: 'category'
  },
  color: {
    type: String,
    default: '#2196F3',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !this.isDefault;
    }
  },
  hiddenByUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for category's expenses
categorySchema.virtual('expenses', {
  ref: 'Expense',
  localField: '_id',
  foreignField: 'categoryId'
});

// Virtual for expense count
categorySchema.virtual('expenseCount', {
  ref: 'Expense',
  localField: '_id',
  foreignField: 'categoryId',
  count: true
});

// Index for better query performance
categorySchema.index({ name: 1 });
categorySchema.index({ isDefault: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ createdBy: 1 });

// Ensure unique category names per user (except for default categories)
categorySchema.index({ name: 1, createdBy: 1 }, { 
  unique: true,
  partialFilterExpression: { createdBy: { $exists: true } }
});

// Static method to get default categories
categorySchema.statics.getDefaultCategories = function() {
  return this.find({ isDefault: true, isActive: true });
};

// Static method to create default categories
categorySchema.statics.createDefaultCategories = async function() {
  const defaultCategories = [
    { name: 'Food & Dining', icon: 'restaurant', color: '#FF5722', isDefault: true },
    { name: 'Transportation', icon: 'directions_car', color: '#2196F3', isDefault: true },
    { name: 'Shopping', icon: 'shopping_cart', color: '#9C27B0', isDefault: true },
    { name: 'Entertainment', icon: 'movie', color: '#E91E63', isDefault: true },
    { name: 'Bills & Utilities', icon: 'receipt', color: '#FF9800', isDefault: true },
    { name: 'Healthcare', icon: 'local_hospital', color: '#4CAF50', isDefault: true },
    { name: 'Education', icon: 'school', color: '#607D8B', isDefault: true },
    { name: 'Travel', icon: 'flight', color: '#00BCD4', isDefault: true },
    { name: 'Personal Care', icon: 'face', color: '#795548', isDefault: true },
    { name: 'Others', icon: 'more_horiz', color: '#9E9E9E', isDefault: true }
  ];

  try {
    for (const category of defaultCategories) {
      const exists = await this.findOne({ name: category.name, isDefault: true });
      if (!exists) {
        await this.create(category);
      }
    }
    console.log('✅ Default categories created/verified');
  } catch (error) {
    console.error('❌ Error creating default categories:', error);
  }
};

module.exports = mongoose.model('Category', categorySchema);
