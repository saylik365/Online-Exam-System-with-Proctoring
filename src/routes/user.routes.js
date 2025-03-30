const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const { verifyToken, verifyOTP } = require('../middleware/auth.middleware');
const passport = require('passport');
const emailService = require('../services/email.service');
require('../config/passport-google');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phoneNumber } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new user
    const user = new User({ name, email, password, role, phoneNumber });
    
    // Generate OTP
    const otp = user.generateOTP();
    console.log('Generated OTP:', otp);
    
    // Save user with OTP
    await user.save();
    console.log('User saved with OTP:', user.otp);

    // Send OTP email
    const emailSent = await emailService.sendOTPEmail(email, otp);

    if (!emailSent) {
      return res.status(500).json({ message: 'Error sending verification email' });
    }

    res.status(201).json({ 
      message: 'Registration successful. Please check your email for OTP.',
      userId: user._id,
      email: email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Verify OTP after registration
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log('Verifying OTP for email:', email);
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found, OTP from DB:', user.otp?.code);
    console.log('OTP received:', otp);

    // Verify OTP
    const isValidOTP = user.verifyOTP(otp);
    if (!isValidOTP) {
      console.log('Invalid OTP');
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    await user.save();

    // Generate JWT token
    const token = user.generateAuthToken();
    res.json({ 
      message: 'Email verified successfully',
      token, 
      user: { ...user.toJSON(), password: undefined } 
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const otp = await user.generateOTP();
    const emailSent = await emailService.sendOTPEmail(email, otp);

    if (!emailSent) {
      return res.status(500).json({ message: 'Error sending verification email' });
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resending OTP', error: error.message });
  }
});

// Login with email and password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user and verify password
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // For development, we'll skip email verification
    // if (!user.isEmailVerified) {
    //   return res.status(401).json({ message: 'Please verify your email first' });
    // }

    // Generate JWT token
    const token = user.generateAuthToken();
    res.json({ token, user: { ...user.toJSON(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Google OAuth login
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const token = req.user.generateAuthToken();
      res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
    } catch (error) {
      res.redirect(`${process.env.CLIENT_URL}/auth/error`);
    }
  }
);

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('examHistory');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['name', 'phoneNumber', 'department', 'course', 'semester', 'batch'];
    
    // Filter out non-allowed updates
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    const user = await User.findByIdAndUpdate(
      req.user._id,
      filteredUpdates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

module.exports = router; 