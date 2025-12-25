const express = require('express');
const Booking = require('../models/Booking');
const Worker = require('../models/Worker');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can create bookings' });
    }

    const booking = await Booking.create({
      customerId: req.user.id,
      ...req.body
    });

    await booking.populate('workerId', 'userId category hourlyRate');
    await booking.populate('customerId', 'name phone');
    await booking.populate('categoryId', 'name nameUrdu');

    res.status(201).json({
      success: true,
      booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/bookings
// @desc    Get user bookings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, type } = req.query;
    const query = {};

    if (req.user.role === 'customer') {
      query.customerId = req.user.id;
    } else if (req.user.role === 'worker') {
      const worker = await Worker.findOne({ userId: req.user.id });
      if (!worker) {
        return res.status(404).json({ message: 'Worker profile not found' });
      }
      query.workerId = worker._id;
    }

    if (status) {
      query.status = status;
    }

    if (type) {
      query.serviceType = type;
    }

    const bookings = await Booking.find(query)
      .populate('customerId', 'name phone avatar')
      .populate('workerId', 'userId category')
      .populate('categoryId', 'name nameUrdu')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'name phone email avatar address')
      .populate('workerId', 'userId category hourlyRate')
      .populate('categoryId', 'name nameUrdu');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user has access
    const isCustomer = booking.customerId._id.toString() === req.user.id;
    const worker = await Worker.findOne({ userId: req.user.id });
    const isWorker = worker && booking.workerId._id.toString() === worker._id.toString();

    if (!isCustomer && !isWorker && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/bookings/:id/accept
// @desc    Accept booking (Worker)
// @access  Private/Worker
router.put('/:id/accept', protect, async (req, res) => {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({ message: 'Only workers can accept bookings' });
    }

    const worker = await Worker.findOne({ userId: req.user.id });
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.workerId.toString() !== worker._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Booking cannot be accepted' });
    }

    booking.status = 'accepted';
    await booking.save();

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/bookings/:id/complete
// @desc    Complete booking
// @access  Private
router.put('/:id/complete', protect, async (req, res) => {
  try {
    const { finalCost } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const worker = await Worker.findOne({ userId: req.user.id });
    const isWorker = worker && booking.workerId.toString() === worker._id.toString();
    const isCustomer = booking.customerId.toString() === req.user.id;

    if (!isWorker && !isCustomer && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (finalCost) {
      booking.finalCost = finalCost;
    }

    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();

    // Update worker stats
    if (worker) {
      worker.completedJobs += 1;
      await worker.save();
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel booking
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const worker = await Worker.findOne({ userId: req.user.id });
    const isWorker = worker && booking.workerId.toString() === worker._id.toString();
    const isCustomer = booking.customerId.toString() === req.user.id;

    if (!isWorker && !isCustomer && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelledBy = req.user.role === 'admin' ? 'admin' : (isCustomer ? 'customer' : 'worker');
    await booking.save();

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/bookings/:id/rating
// @desc    Add rating and review
// @access  Private/Customer
router.post('/:id/rating', protect, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can rate' });
    }

    const { score, comment, review } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed bookings' });
    }

    booking.rating = { score, comment, date: new Date() };
    if (review) {
      booking.review = { text: review, date: new Date() };
    }
    await booking.save();

    // Update worker rating
    const worker = await Worker.findById(booking.workerId);
    if (worker) {
      const totalRating = worker.rating.average * worker.rating.count + score;
      worker.rating.count += 1;
      worker.rating.average = totalRating / worker.rating.count;
      await worker.save();
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

