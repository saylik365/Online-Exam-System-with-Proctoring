const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { sendOTP } = require('../utils/otp');
const { sendEmail } = require('../utils/email');
const { generateToken } = require('../utils/token');
const { validationResult } = require('express-validator');

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role
    });

    await user.save();

    res.status(201).json({
      message: 'Registration successful',
      userId: user._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateToken(user);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error during login' });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.verifyOTP(otp)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark as verified based on verification type
    if (req.body.type === 'email') {
      user.isEmailVerified = true;
    } else if (req.body.type === 'phone') {
      user.isPhoneVerified = true;
    }

    await user.save();

    res.json({ message: 'Verification successful' });
  } catch (error) {
    res.status(500).json({ error: 'Error during verification' });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const otp = user.generateOTP();
    await user.save();

    // Send OTP via email and SMS
    await Promise.all([
      sendEmail(email, 'Verify your email', `Your OTP is: ${otp}`),
      user.phoneNumber && sendOTP(user.phoneNumber, otp)
    ]);

    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error resending OTP' });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    // Implement Google OAuth verification here
    res.status(501).json({ error: 'Google OAuth not implemented yet' });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Error during Google authentication' });
  }
};

const logout = async (req, res) => {
  try {
    // For now, just return success as token invalidation would be handled client-side
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Error during logout' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const tokens = generateToken(user);
    res.json(tokens);
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = user.generateResetToken();
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail(email, 'Reset Password', `Click here to reset your password: ${resetUrl}`);

    res.json({ message: 'Password reset instructions sent to your email' });
  } catch (error) {
    res.status(500).json({ error: 'Error processing forgot password request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: 'Error resetting password' });
  }
};

module.exports = {
  register,
  login,
  verifyOTP,
  resendOTP,
  googleAuth,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword
};