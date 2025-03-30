const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'short-answer', 'essay', 'coding'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subCategory: {
    type: String,
    trim: true
  },
  points: {
    type: Number,
    required: true,
    default: 1
  },
  // Fields for multiple choice questions
  options: [{
    text: String,
    isCorrect: Boolean,
    explanation: String
  }],
  // Fields for coding questions
  codingQuestion: {
    initialCode: String,
    testCases: [{
      input: String,
      expectedOutput: String,
      isHidden: {
        type: Boolean,
        default: false
      }
    }],
    timeLimit: Number, // in seconds
    memoryLimit: Number, // in MB
    language: {
      type: String,
      enum: ['javascript', 'python', 'java', 'cpp']
    }
  },
  // Fields for essay questions
  essayQuestion: {
    minWords: Number,
    maxWords: Number,
    rubric: [{
      criterion: String,
      points: Number
    }]
  },
  // Fields for short answer questions
  shortAnswer: {
    correctAnswers: [String],
    keywords: [String],
    maxLength: Number
  },
  // Common fields
  explanation: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  averageTimeSpent: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Method to validate question based on type
questionSchema.methods.validateQuestion = function() {
  switch (this.type) {
    case 'multiple-choice':
      if (!this.options || this.options.length < 2) {
        throw new Error('Multiple choice questions must have at least 2 options');
      }
      if (!this.options.some(opt => opt.isCorrect)) {
        throw new Error('Multiple choice questions must have at least one correct option');
      }
      break;
    case 'coding':
      if (!this.codingQuestion || !this.codingQuestion.testCases || this.codingQuestion.testCases.length === 0) {
        throw new Error('Coding questions must have at least one test case');
      }
      break;
    case 'essay':
      if (!this.essayQuestion || !this.essayQuestion.rubric || this.essayQuestion.rubric.length === 0) {
        throw new Error('Essay questions must have a rubric');
      }
      break;
    case 'short-answer':
      if (!this.shortAnswer || !this.shortAnswer.correctAnswers || this.shortAnswer.correctAnswers.length === 0) {
        throw new Error('Short answer questions must have at least one correct answer');
      }
      break;
  }
};

// Pre-save middleware to validate question
questionSchema.pre('save', function(next) {
  try {
    this.validateQuestion();
    next();
  } catch (error) {
    next(error);
  }
});

// Method to update usage statistics
questionSchema.methods.updateStats = async function(timeSpent, isCorrect) {
  this.usageCount += 1;
  this.averageTimeSpent = (this.averageTimeSpent * (this.usageCount - 1) + timeSpent) / this.usageCount;
  this.successRate = (this.successRate * (this.usageCount - 1) + (isCorrect ? 1 : 0)) / this.usageCount;
  return this.save();
};

const Question = mongoose.model('Question', questionSchema);

module.exports = Question; 