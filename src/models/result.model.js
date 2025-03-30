const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  answer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  pointsEarned: {
    type: Number,
    required: true
  },
  timeSpent: {
    type: Number, // in seconds
    required: true
  },
  // Additional fields for better tracking
  attempts: [{
    answer: mongoose.Schema.Types.Mixed,
    timestamp: Date,
    isCorrect: Boolean
  }],
  reviewStatus: {
    type: String,
    enum: ['pending', 'reviewed', 'appealed'],
    default: 'pending'
  },
  reviewNotes: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: Date
});

const resultSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [answerSchema],
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  totalPoints: {
    type: Number,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['passed', 'failed', 'pending', 'reviewed', 'appealed'],
    required: true
  },
  // Proctoring data
  proctoringData: {
    browserTabs: [{
      url: String,
      timestamp: Date,
      duration: Number // in seconds
    }],
    faceDetection: [{
      confidence: Number,
      timestamp: Date,
      faceCount: Number,
      isViolation: Boolean
    }],
    audioLevels: [{
      level: Number,
      timestamp: Date,
      isViolation: Boolean
    }],
    violations: [{
      type: String,
      timestamp: Date,
      details: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    }],
    systemInfo: {
      ipAddress: String,
      browserInfo: String,
      osInfo: String,
      deviceInfo: String
    }
  },
  // Additional fields
  isDisqualified: {
    type: Boolean,
    default: false
  },
  disqualificationReason: String,
  disqualificationDetails: {
    type: String,
    timestamp: Date,
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewNotes: String,
  reviewDate: Date,
  // Analytics data
  analytics: {
    timePerQuestion: {
      type: Number,
      default: 0
    },
    questionAttempts: {
      type: Number,
      default: 0
    },
    correctFirstAttempt: {
      type: Number,
      default: 0
    },
    timeDistribution: {
      easy: Number,
      medium: Number,
      hard: Number
    },
    categoryPerformance: [{
      category: String,
      score: Number,
      totalQuestions: Number
    }],
    difficultyPerformance: [{
      difficulty: String,
      score: Number,
      totalQuestions: Number
    }]
  },
  // Appeal information
  appeal: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    reason: String,
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewNotes: String
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
resultSchema.index({ exam: 1, student: 1 }, { unique: true });
resultSchema.index({ 'student': 1, 'status': 1 });
resultSchema.index({ 'exam': 1, 'status': 1 });
resultSchema.index({ 'createdAt': -1 });

// Method to calculate score and status
resultSchema.methods.calculateResults = function() {
  this.totalPoints = this.answers.reduce((total, answer) => total + answer.pointsEarned, 0);
  this.percentage = (this.totalPoints / this.exam.totalPoints) * 100;
  this.status = this.percentage >= this.exam.passingScore ? 'passed' : 'failed';
};

// Method to update analytics
resultSchema.methods.updateAnalytics = function() {
  const totalQuestions = this.answers.length;
  const totalTime = this.endTime - this.startTime;
  
  this.analytics.timePerQuestion = totalTime / totalQuestions;
  this.analytics.questionAttempts = this.answers.reduce((total, answer) => 
    total + answer.attempts.length, 0);
  this.analytics.correctFirstAttempt = this.answers.filter(answer => 
    answer.attempts.length === 1 && answer.isCorrect).length;

  // Calculate performance by category and difficulty
  const categoryPerformance = {};
  const difficultyPerformance = {};

  this.answers.forEach(answer => {
    const question = answer.questionId;
    if (question.category) {
      if (!categoryPerformance[question.category]) {
        categoryPerformance[question.category] = { score: 0, total: 0 };
      }
      categoryPerformance[question.category].score += answer.pointsEarned;
      categoryPerformance[question.category].total += 1;
    }

    if (question.difficulty) {
      if (!difficultyPerformance[question.difficulty]) {
        difficultyPerformance[question.difficulty] = { score: 0, total: 0 };
      }
      difficultyPerformance[question.difficulty].score += answer.pointsEarned;
      difficultyPerformance[question.difficulty].total += 1;
    }
  });

  this.analytics.categoryPerformance = Object.entries(categoryPerformance).map(([category, data]) => ({
    category,
    score: data.score,
    totalQuestions: data.total
  }));

  this.analytics.difficultyPerformance = Object.entries(difficultyPerformance).map(([difficulty, data]) => ({
    difficulty,
    score: data.score,
    totalQuestions: data.total
  }));
};

// Method to submit appeal
resultSchema.methods.submitAppeal = function(reason) {
  this.appeal = {
    status: 'pending',
    reason,
    submittedAt: new Date()
  };
  this.status = 'appealed';
  return this.save();
};

// Method to review appeal
resultSchema.methods.reviewAppeal = function(status, reviewedBy, notes) {
  this.appeal.status = status;
  this.appeal.reviewedAt = new Date();
  this.appeal.reviewedBy = reviewedBy;
  this.appeal.reviewNotes = notes;
  this.status = status === 'approved' ? 'reviewed' : 'failed';
  return this.save();
};

const Result = mongoose.model('Result', resultSchema);

module.exports = Result; 