const express = require('express');
const Worker = require('../models/Worker');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/services
// @desc    Get all workers/services
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, city, minRating, search, page = 1, limit = 10 } = req.query;
    const query = { isApproved: true, isVerified: true };

    if (category) {
      query.category = category;
    }

    if (minRating) {
      query['rating.average'] = { $gte: parseFloat(minRating) };
    }

    if (search) {
      query.$or = [
        { bio: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } }
      ];
    }

    if (city) {
      query['serviceAreas.city'] = { $regex: city, $options: 'i' };
    }

    const workers = await Worker.find(query)
      .populate('userId', 'name email phone avatar address')
      .populate('category', 'name nameUrdu icon')
      .populate('subcategories', 'name nameUrdu')
      .sort({ 'rating.average': -1, 'rating.count': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Worker.countDocuments(query);

    res.json({
      success: true,
      count: workers.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      workers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/services/:id
// @desc    Get single worker/service
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .populate('userId', 'name email phone avatar address')
      .populate('category', 'name nameUrdu icon')
      .populate('subcategories', 'name nameUrdu');

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    res.json({
      success: true,
      worker
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/services
// @desc    Create/Update worker profile
// @access  Private/Worker
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({ message: 'Only workers can create service profiles' });
    }

    let worker = await Worker.findOne({ userId: req.user.id });

    if (worker) {
      // Update existing
      worker = await Worker.findByIdAndUpdate(
        worker._id,
        { ...req.body, updatedAt: Date.now() },
        { new: true, runValidators: true }
      );
    } else {
      // Create new
      worker = await Worker.create({
        userId: req.user.id,
        ...req.body
      });
    }

    await worker.populate('category', 'name nameUrdu');
    await worker.populate('userId', 'name email phone');

    res.json({
      success: true,
      worker
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

