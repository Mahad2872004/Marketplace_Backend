const express = require('express');
const Category = require('../models/Category');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { parent, active } = req.query;
    const query = {};

    if (parent === 'null' || parent === '') {
      query.parentCategory = null;
    } else if (parent) {
      query.parentCategory = parent;
    }

    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    const categories = await Category.find(query)
      .populate('parentCategory', 'name nameUrdu')
      .sort({ sortOrder: 1, name: 1 });

    res.json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parentCategory', 'name nameUrdu');

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({
      success: true,
      category
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/categories
// @desc    Create category (Admin only)
// @access  Private/Admin
router.post('/', async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({
      success: true,
      category
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

