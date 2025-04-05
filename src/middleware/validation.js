const { createError } = require('../utils/error');

// Validate exam creation/update
exports.validateExam = (req, res, next) => {
  const { title, description, duration, startTime, endTime, questions } = req.body;

  // Required fields
  if (!title || !description || !duration || !startTime || !endTime || !questions) {
    return next(createError(400, 'Missing required fields'));
  }

  // Title and description length
  if (title.length < 3 || title.length > 100) {
    return next(createError(400, 'Title must be between 3 and 100 characters'));
  }
  if (description.length < 10 || description.length > 1000) {
    return next(createError(400, 'Description must be between 10 and 1000 characters'));
  }

  // Duration must be positive
  if (duration < 1) {
    return next(createError(400, 'Duration must be at least 1 minute'));
  }

  // Start time must be in the future
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (start <= now) {
    return next(createError(400, 'Start time must be in the future'));
  }

  // End time must be after start time
  if (end <= start) {
    return next(createError(400, 'End time must be after start time'));
  }

  // Questions validation
  if (!Array.isArray(questions) || questions.length === 0) {
    return next(createError(400, 'At least one question is required'));
  }

  for (const question of questions) {
    // Required question fields
    if (!question.text || !question.options || !question.correctAnswer) {
      return next(createError(400, 'Invalid question format'));
    }

    // Options validation
    if (!Array.isArray(question.options) || question.options.length < 2) {
      return next(createError(400, 'Each question must have at least 2 options'));
    }

    // Correct answer validation
    if (typeof question.correctAnswer !== 'number' || 
        question.correctAnswer < 0 || 
        question.correctAnswer >= question.options.length) {
      return next(createError(400, 'Invalid correct answer'));
    }

    // Marks validation
    if (question.marks && (question.marks < 0 || !Number.isInteger(question.marks))) {
      return next(createError(400, 'Marks must be a positive integer'));
    }
  }

  next();
};

// Validate user registration
exports.validateRegistration = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(createError(400, 'Missing required fields'));
  }

  // Name validation
  if (name.length < 2 || name.length > 50) {
    return next(createError(400, 'Name must be between 2 and 50 characters'));
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(createError(400, 'Invalid email format'));
  }

  // Password validation
  if (password.length < 6) {
    return next(createError(400, 'Password must be at least 6 characters'));
  }

  next();
};

// Validate profile update
exports.validateProfileUpdate = (req, res, next) => {
  const { name, email, phoneNumber } = req.body;

  if (!name || !email) {
    return next(createError(400, 'Name and email are required'));
  }

  // Name validation
  if (name.length < 2 || name.length > 50) {
    return next(createError(400, 'Name must be between 2 and 50 characters'));
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(createError(400, 'Invalid email format'));
  }

  // Phone number validation (optional)
  if (phoneNumber) {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return next(createError(400, 'Invalid phone number format'));
    }
  }

  next();
}; 