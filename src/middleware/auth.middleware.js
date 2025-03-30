const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Role-based access control middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'You do not have permission to perform this action' 
      });
    }
    next();
  };
};

// Verify OTP middleware
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isValidOTP = await user.verifyOTP(otp);
    if (!isValidOTP) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error verifying OTP' });
  }
};

const requireProctoring = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    if (exam.settings.requireProctoring && !req.user.isProctoringEnabled) {
      return res.status(403).json({ error: 'Proctoring is required for this exam.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking proctoring requirements.' });
  }
};

module.exports = { verifyToken, authorize, verifyOTP, requireProctoring }; 