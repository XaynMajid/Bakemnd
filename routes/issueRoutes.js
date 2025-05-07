const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Issue = require('../models/Issue');
const Mechanic = require('../models/Mechanic');

// Create new issue
router.post('/create', auth, [
  body('location.coordinates').isArray().withMessage('Location coordinates are required'),
  body('vehicleType').isIn(['Car', 'Motorcycle']).withMessage('Invalid vehicle type'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('expectedPrice').isNumeric().withMessage('Expected price must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { location, vehicleType, description, expectedPrice } = req.body;

    const issue = new Issue({
      user: req.user.userId,
      location,
      vehicleType,
      description,
      expectedPrice
    });

    await issue.save();

    res.status(201).json(issue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get nearby issues for mechanics
router.get('/nearby', auth, async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 10000 } = req.query; // maxDistance in meters

    const issues = await Issue.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      },
      status: 'PENDING'
    }).populate('user', 'fullName phoneNumber');

    res.json(issues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit offer for an issue
router.post('/:issueId/offer', auth, [
  body('price').isNumeric().withMessage('Price must be a number'),
  body('estimatedTime').isNumeric().withMessage('Estimated time must be a number'),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { price, estimatedTime, notes } = req.body;
    const issue = await Issue.findById(req.params.issueId);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    if (issue.status !== 'PENDING') {
      return res.status(400).json({ message: 'Issue is no longer accepting offers' });
    }

    // Check if mechanic has already made an offer
    const existingOffer = issue.offers.find(
      offer => offer.mechanic.toString() === req.user.mechanicId
    );

    if (existingOffer) {
      return res.status(400).json({ message: 'You have already made an offer for this issue' });
    }

    issue.offers.push({
      mechanic: req.user.mechanicId,
      price,
      estimatedTime,
      notes
    });

    issue.status = 'OFFERED';
    await issue.save();

    res.json(issue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept an offer
router.post('/:issueId/accept/:offerId', auth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.issueId);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    if (issue.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const offer = issue.offers.id(req.params.offerId);

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    offer.status = 'ACCEPTED';
    issue.status = 'ACCEPTED';
    issue.acceptedOffer = offer.mechanic;

    // Reject all other offers
    issue.offers.forEach(o => {
      if (o._id.toString() !== req.params.offerId) {
        o.status = 'REJECTED';
      }
    });

    await issue.save();

    res.json(issue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject an offer
router.post('/:issueId/reject/:offerId', auth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.issueId);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    if (issue.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const offer = issue.offers.id(req.params.offerId);

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    offer.status = 'REJECTED';
    await issue.save();

    res.json(issue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's issues
router.get('/user', auth, async (req, res) => {
  try {
    console.log('Getting user issues for user:', req.user.userId);
    
    const issues = await Issue.find({ user: req.user.userId })
      .populate('acceptedOffer', 'fullName phoneNumber')
      .sort({ createdAt: -1 });

    console.log('Found issues:', issues);
    res.json(issues);
  } catch (err) {
    console.error('Error getting user issues:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get mechanic's offers
router.get('/mechanic/offers', auth, async (req, res) => {
  try {
    const issues = await Issue.find({
      'offers.mechanic': req.user.mechanicId
    })
    .populate('user', 'fullName phoneNumber')
    .sort({ createdAt: -1 });

    res.json(issues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single issue by ID
router.get('/:issueId', auth, async (req, res) => {
  try {
    console.log('Getting issue with ID:', req.params.issueId);
    
    const issue = await Issue.findById(req.params.issueId)
      .populate('user', 'fullName phoneNumber')
      .populate('offers.mechanic', 'fullName phoneNumber location rating');

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    console.log('Found issue:', issue);
    res.json(issue);
  } catch (err) {
    console.error('Error getting issue:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

