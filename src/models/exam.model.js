const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'short-answer', 'essay'],
    required: true
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: String,
  points: {
    type: Number,
    required: true,
    default: 1
  },
  explanation: String,
  image: String
});

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  duration: {
    type: Number, // in minutes
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  questions: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    points: {
      type: Number,
      required: true
    }
  }],
  totalPoints: {
    type: Number,
    required: true
  },
  passingScore: {
    type: Number,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    allowCalculator: {
      type: Boolean,
      default: false
    },
    allowNotes: {
      type: Boolean,
      default: false
    },
    shuffleQuestions: {
      type: Boolean,
      default: true
    },
    showResults: {
      type: Boolean,
      default: true
    },
    requireProctoring: {
      type: Boolean,
      default: true
    },
    // Additional settings
    allowReview: {
      type: Boolean,
      default: false
    },
    reviewDuration: {
      type: Number, // in minutes
      default: 0
    },
    negativeMarking: {
      type: Boolean,
      default: false
    },
    negativeMarkingValue: {
      type: Number,
      default: 0
    },
    timePerQuestion: {
      type: Number, // in minutes
      default: 0
    },
    showTimer: {
      type: Boolean,
      default: true
    },
    showProgress: {
      type: Boolean,
      default: true
    },
    allowQuestionNavigation: {
      type: Boolean,
      default: true
    },
    requireAllQuestions: {
      type: Boolean,
      default: false
    }
  },
  allowedStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'started', 'completed', 'disqualified'],
      default: 'pending'
    },
    startTime: Date,
    endTime: Date,
    ipAddress: String,
    browserInfo: String
  }],
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'draft'
  },
  // Additional fields
  category: {
    type: String,
    required: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  instructions: {
    type: String,
    required: true
  },
  syllabus: [{
    topic: String,
    description: String
  }],
  statistics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    passRate: {
      type: Number,
      default: 0
    },
    averageTime: {
      type: Number,
      default: 0
    }
  },
  feedback: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Calculate total points before saving
examSchema.pre('save', function(next) {
  this.totalPoints = this.questions.reduce((total, question) => total + question.points, 0);
  next();
});

// Method to check if exam is currently active
examSchema.methods.checkIfActive = function() {
  const now = new Date();
  return now >= this.startTime && now <= this.endTime;
};

// Method to check if exam has started
examSchema.methods.hasStarted = function() {
  return new Date() >= this.startTime;
};

// Method to check if exam has ended
examSchema.methods.hasEnded = function() {
  return new Date() > this.endTime;
};

// Method to add a student to allowed students
examSchema.methods.addStudent = function(studentId) {
  if (!this.allowedStudents.some(s => s.student.toString() === studentId.toString())) {
    this.allowedStudents.push({
      student: studentId
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to update student status
examSchema.methods.updateStudentStatus = function(studentId, status, ipAddress, browserInfo) {
  const student = this.allowedStudents.find(s => s.student.toString() === studentId.toString());
  if (student) {
    student.status = status;
    if (status === 'started') {
      student.startTime = new Date();
    } else if (status === 'completed' || status === 'disqualified') {
      student.endTime = new Date();
    }
    if (ipAddress) student.ipAddress = ipAddress;
    if (browserInfo) student.browserInfo = browserInfo;
    return this.save();
  }
  return Promise.reject(new Error('Student not found in allowed students'));
};

// Method to add feedback
examSchema.methods.addFeedback = function(studentId, rating, comment) {
  this.feedback.push({
    student: studentId,
    rating,
    comment
  });
  return this.save();
};

// Method to update statistics
examSchema.methods.updateStatistics = function(score, timeTaken) {
  this.statistics.totalAttempts += 1;
  this.statistics.averageScore = 
    (this.statistics.averageScore * (this.statistics.totalAttempts - 1) + score) / 
    this.statistics.totalAttempts;
  this.statistics.averageTime = 
    (this.statistics.averageTime * (this.statistics.totalAttempts - 1) + timeTaken) / 
    this.statistics.totalAttempts;
  this.statistics.passRate = 
    (this.allowedStudents.filter(s => s.status === 'completed').length / 
    this.allowedStudents.length) * 100;
  return this.save();
};

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam; 