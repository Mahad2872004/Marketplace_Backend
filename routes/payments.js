const express = require('express');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Platform commission rate (10%)
const PLATFORM_COMMISSION = 0.10;

// @route   POST /api/payments/initiate
// @desc    Initiate payment
// @access  Private
router.post('/initiate', protect, async (req, res) => {
  try {
    const { bookingId, paymentMethod } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'name phone')
      .populate('workerId', 'userId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.customerId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Booking already paid' });
    }

    const amount = booking.finalCost || booking.estimatedCost;
    if (!amount) {
      return res.status(400).json({ message: 'No amount specified' });
    }

    const platformFee = amount * PLATFORM_COMMISSION;
    const workerEarning = amount - platformFee;

    // For cash payments, mark as paid immediately
    if (paymentMethod === 'cash') {
      const payment = await Payment.create({
        bookingId: booking._id,
        customerId: booking.customerId._id,
        workerId: booking.workerId._id,
        amount,
        platformFee,
        workerEarning,
        paymentMethod: 'cash',
        status: 'completed',
        paidAt: new Date()
      });

      booking.paymentMethod = 'cash';
      booking.paymentStatus = 'paid';
      await booking.save();

      return res.json({
        success: true,
        payment,
        message: 'Payment recorded (Cash on Delivery)'
      });
    }

    // For online payments, create pending payment
    // TODO: Integrate with JazzCash/EasyPaisa APIs
    const payment = await Payment.create({
      bookingId: booking._id,
      customerId: booking.customerId._id,
      workerId: booking.workerId._id,
      amount,
      platformFee,
      workerEarning,
      paymentMethod,
      status: 'pending'
    });

    booking.paymentMethod = paymentMethod;
    await booking.save();

    // Return payment gateway URL or transaction details
    res.json({
      success: true,
      payment,
      gatewayUrl: `/${paymentMethod}/payment`, // Placeholder
      message: 'Payment initiated. Redirect to gateway.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/payments/callback
// @desc    Payment callback from gateway
// @access  Public (called by payment gateway)
router.post('/callback', async (req, res) => {
  try {
    // TODO: Verify payment gateway signature
    const { transactionId, status, paymentId } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (status === 'success') {
      payment.status = 'completed';
      payment.transactionId = transactionId;
      payment.paidAt = new Date();
      payment.gatewayResponse = req.body;
      await payment.save();

      const booking = await Booking.findById(payment.bookingId);
      booking.paymentStatus = 'paid';
      await booking.save();
    } else {
      payment.status = 'failed';
      payment.gatewayResponse = req.body;
      await payment.save();
    }

    res.json({ success: true, payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/payments
// @desc    Get user payments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const query = {};

    if (req.user.role === 'customer') {
      query.customerId = req.user.id;
    } else if (req.user.role === 'worker') {
      const Worker = require('../models/Worker');
      const worker = await Worker.findOne({ userId: req.user.id });
      if (worker) {
        query.workerId = worker._id;
      }
    }

    const payments = await Payment.find(query)
      .populate('bookingId', 'description status')
      .populate('customerId', 'name phone')
      .populate('workerId', 'userId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

