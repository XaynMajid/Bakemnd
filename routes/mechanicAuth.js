const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Mechanic = require('../models/Mechanic');
const auth = require('../middleware/auth');

// Register Mechanic
router.post('/register', [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('cnic').trim().notEmpty().withMessage('CNIC is required'),
  body('experience').trim().notEmpty().withMessage('Experience is required'),
  body('hourlyRate').trim().notEmpty().withMessage('Hourly rate is required'),
  body('vehicleTypes').isArray().withMessage('Vehicle types must be an array'),
  body('serviceRadius').trim().notEmpty().withMessage('Service radius is required'),
  body('serviceAreas').trim().notEmpty().withMessage('Service areas is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      email,
      password,
      fullName,
      phoneNumber,
      address,
      cnic,
      experience,
      hourlyRate,
      availability,
      vehicleTypes,
      serviceRadius,
      serviceAreas
    } = req.body;

    // Check if mechanic already exists
    let mechanic = await Mechanic.findOne({ $or: [{ email }, { cnic }] });
    if (mechanic) {
      return res.status(400).json({ message: 'Mechanic already exists' });
    }

    // Create new mechanic
    mechanic = new Mechanic({
      email,
      password,
      fullName,
      phoneNumber,
      address,
      cnic,
      experience,
      hourlyRate,
      availability,
      vehicleTypes,
      serviceRadius,
      serviceAreas
    });

    await mechanic.save();

    // Create JWT token
    const token = jwt.sign(
      { mechanicId: mechanic._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      mechanic: {
        id: mechanic._id,
        fullName: mechanic.fullName,
        email: mechanic.email,
        phoneNumber: mechanic.phoneNumber,
        address: mechanic.address,
        cnic: mechanic.cnic,
        experience: mechanic.experience,
        hourlyRate: mechanic.hourlyRate,
        availability: mechanic.availability,
        vehicleTypes: mechanic.vehicleTypes,
        serviceRadius: mechanic.serviceRadius,
        serviceAreas: mechanic.serviceAreas
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login Mechanic
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if mechanic exists
    const mechanic = await Mechanic.findOne({ email });
    if (!mechanic) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await mechanic.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { mechanicId: mechanic._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      mechanic: {
        id: mechanic._id,
        fullName: mechanic.fullName,
        email: mechanic.email,
        phoneNumber: mechanic.phoneNumber,
        address: mechanic.address,
        cnic: mechanic.cnic,
        experience: mechanic.experience,
        hourlyRate: mechanic.hourlyRate,
        availability: mechanic.availability,
        vehicleTypes: mechanic.vehicleTypes,
        serviceRadius: mechanic.serviceRadius,
        serviceAreas: mechanic.serviceAreas,
        isLive: mechanic.isLive,
        rating: mechanic.rating
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Mechanic Profile
router.get('/profile', auth, async (req, res) => {
  try {
    const mechanic = await Mechanic.findById(req.user.mechanicId).select('-password');
    if (!mechanic) {
      return res.status(404).json({ message: 'Mechanic not found' });
    }
    res.json(mechanic);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Live Status
router.patch('/live-status', auth, async (req, res) => {
  try {
    const { isLive } = req.body;
    const mechanic = await Mechanic.findByIdAndUpdate(
      req.user.mechanicId,
      { isLive },
      { new: true }
    ).select('-password');

    if (!mechanic) {
      return res.status(404).json({ message: 'Mechanic not found' });
    }

    res.json(mechanic);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 