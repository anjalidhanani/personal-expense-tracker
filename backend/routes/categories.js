const express = require('express');
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateCategory, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories (default + user's custom categories) excluding user-hidden ones, including inactive
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const categories = await Category.find({
      $or: [
        { isDefault: true },
        { createdBy: req.user._id }
      ],
      hiddenByUsers: { $ne: req.user._id }
    }).sort({ isActive: -1, isDefault: -1, name: 1 });

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
});

// @route   GET /api/categories/default
// @desc    Get default categories only
// @access  Private
router.get('/default', authenticate, async (req, res) => {
  try {
    const categories = await Category.getDefaultCategories();

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get default categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching default categories'
    });
  }
});

// @route   GET /api/categories/custom
// @desc    Get user's custom categories only
// @access  Private
router.get('/custom', authenticate, async (req, res) => {
  try {
    const categories = await Category.find({
      createdBy: req.user._id,
      isActive: true
    }).sort({ name: 1 });

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get custom categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching custom categories'
    });
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Private
router.get('/:id', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      $or: [
        { isDefault: true },
        { createdBy: req.user._id }
      ],
      isActive: true
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: { category }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching category'
    });
  }
});

// @route   POST /api/categories
// @desc    Create new custom category
// @access  Private
router.post('/', authenticate, validateCategory, async (req, res) => {
  try {
    // Check if category with same name already exists for user
    const existingCategory = await Category.findOne({
      name: req.body.name,
      $or: [
        { isDefault: true },
        { createdBy: req.user._id }
      ]
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    // Check if user is admin to determine if category should be global
    const isAdminCreated = req.user.role === 'admin';
    
    const category = new Category({
      ...req.body,
      createdBy: isAdminCreated ? null : req.user._id,
      isDefault: isAdminCreated
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating category'
    });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category (admin can update any, users can update their own)
// @access  Private
router.put('/:id', authenticate, validateObjectId('id'), validateCategory, async (req, res) => {
  try {
    // Admin can update any category, regular users can only update their own non-default categories
    const query = req.user.role === 'admin' 
      ? { _id: req.params.id }
      : { _id: req.params.id, createdBy: req.user._id, isDefault: false };
    
    const category = await Category.findOne(query);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or cannot be modified'
      });
    }

    // Check if new name conflicts with existing categories
    if (req.body.name && req.body.name !== category.name) {
      const existingCategory = await Category.findOne({
        name: req.body.name,
        $or: [
          { isDefault: true },
          { createdBy: req.user._id }
        ],
        _id: { $ne: req.params.id }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    Object.assign(category, req.body);
    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category }
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating category'
    });
  }
});

// @route   PATCH /api/categories/:id/toggle-status
// @desc    Toggle category status (active/inactive)
// @access  Private
router.patch('/:id/toggle-status', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      $or: [
        { isDefault: true },
        { createdBy: req.user._id }
      ]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Toggle the status
    category.isActive = !category.isActive;
    await category.save();

    res.json({
      success: true,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { category }
    });
  } catch (error) {
    console.error('Toggle category status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling category status'
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete/hide category with user-specific behavior
// @access  Private
router.delete('/:id', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      $or: [
        { isDefault: true },
        { createdBy: req.user._id }
      ]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Prevent deletion of "Others" category
    if (category.name === 'Others' || category.name === 'Other') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the "Others" category as it serves as the default fallback category.'
      });
    }

    // Check if category is being used in any expenses by this user
    const userExpenseCount = await Expense.countDocuments({
      categoryId: req.params.id,
      userId: req.user._id
    });

    // Handle default categories differently from custom categories
    if (category.isDefault && req.user.role !== 'admin') {
      // For default categories, hide them for regular users only
      if (userExpenseCount > 0) {
        // Find the "Others" category to reassign user's expenses
        let othersCategory = await Category.findOne({
          $or: [
            { name: 'Others', isDefault: true },
            { name: 'Other', isDefault: true }
          ]
        });

        // If "Others" category doesn't exist, create it
        if (!othersCategory) {
          othersCategory = new Category({
            name: 'Others',
            icon: 'more_horiz',
            color: '#9E9E9E',
            isDefault: true,
            description: 'Default fallback category for reassigned expenses'
          });
          await othersCategory.save();
        }

        // Reassign only this user's expenses from the category to "Others"
        await Expense.updateMany(
          { categoryId: req.params.id, userId: req.user._id },
          { categoryId: othersCategory._id }
        );
      }

      // Hide the category for this user
      await Category.findByIdAndUpdate(req.params.id, {
        $addToSet: { hiddenByUsers: req.user._id }
      });

      res.json({
        success: true,
        message: userExpenseCount > 0 
          ? `Category hidden successfully. ${userExpenseCount} expense(s) have been reassigned to "Others" category.`
          : 'Category hidden successfully',
        data: userExpenseCount > 0 ? {
          reassignedExpenses: userExpenseCount,
          newCategoryName: 'Others'
        } : undefined
      });
    } else {
      // For custom categories or admin deleting default categories, actually delete them
      if (category.isDefault && req.user.role === 'admin') {
        // Admin deleting a default category - check all users' expenses
        const totalExpenseCount = await Expense.countDocuments({
          categoryId: req.params.id
        });

        if (totalExpenseCount > 0) {
          // Find the "Others" category to reassign all expenses
          let othersCategory = await Category.findOne({
            $or: [
              { name: 'Others', isDefault: true },
              { name: 'Other', isDefault: true }
            ]
          });

          // If "Others" category doesn't exist, create it
          if (!othersCategory) {
            othersCategory = new Category({
              name: 'Others',
              icon: 'more_horiz',
              color: '#9E9E9E',
              isDefault: true,
              description: 'Default fallback category for reassigned expenses'
            });
            await othersCategory.save();
          }

          // Reassign all expenses to "Others"
          await Expense.updateMany(
            { categoryId: req.params.id },
            { categoryId: othersCategory._id }
          );
        }

        // Actually delete the default category
        await Category.findByIdAndDelete(req.params.id);

        res.json({
          success: true,
          message: totalExpenseCount > 0 
            ? `Category deleted successfully. ${totalExpenseCount} expense(s) have been reassigned to "Others" category.`
            : 'Category deleted successfully',
          data: totalExpenseCount > 0 ? {
            reassignedExpenses: totalExpenseCount,
            newCategoryName: 'Others'
          } : undefined
        });
      } else if (!category.isDefault) {
        // For custom categories, only the creator can delete (unless admin)
        if (req.user.role !== 'admin' && category.createdBy.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'You can only delete categories you created'
          });
        }

        if (userExpenseCount > 0) {
        // Find the "Others" category to reassign expenses
        let othersCategory = await Category.findOne({
          $or: [
            { name: 'Others', isDefault: true },
            { name: 'Other', isDefault: true }
          ]
        });

        // If "Others" category doesn't exist, create it
        if (!othersCategory) {
          othersCategory = new Category({
            name: 'Others',
            icon: 'more_horiz',
            color: '#9E9E9E',
            isDefault: true,
            description: 'Default fallback category for reassigned expenses'
          });
          await othersCategory.save();
        }

        // Reassign user's expenses to "Others"
        await Expense.updateMany(
          { categoryId: req.params.id, userId: req.user._id },
          { categoryId: othersCategory._id }
        );
      }

      // Actually delete the custom category
      await Category.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: userExpenseCount > 0 
          ? `Category deleted successfully. ${userExpenseCount} expense(s) have been reassigned to "Others" category.`
          : 'Category deleted successfully',
        data: userExpenseCount > 0 ? {
          reassignedExpenses: userExpenseCount,
          newCategoryName: 'Others'
        } : undefined
      });
      }
    }
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting category'
    });
  }
});

// @route   GET /api/categories/:id/expenses
// @desc    Get expenses for a specific category
// @access  Private
router.get('/:id/expenses', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Verify category access
    const category = await Category.findOne({
      _id: req.params.id,
      $or: [
        { isDefault: true },
        { createdBy: req.user._id }
      ],
      isActive: true
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const expenses = await Expense.find({
      categoryId: req.params.id,
      userId: req.user._id
    })
    .populate('categoryId', 'name color icon')
    .sort({ date: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const totalExpenses = await Expense.countDocuments({
      categoryId: req.params.id,
      userId: req.user._id
    });

    const totalPages = Math.ceil(totalExpenses / parseInt(limit));

    res.json({
      success: true,
      data: {
        category,
        expenses,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalExpenses,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get category expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching category expenses'
    });
  }
});

module.exports = router;
