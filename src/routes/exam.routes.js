const express = require('express');
const router = express.Router();
const Exam = require('../models/exam.model');
const Result = require('../models/result.model');
const { verifyToken, authorize } = require('../middleware/auth.middleware');

// Create new exam (Faculty only)
router.post('/create-exam', verifyToken, authorize('faculty'), async (req, res) => {
  try {
    const examData = {
      ...req.body,
      createdBy: req.user._id
    };

    const exam = new Exam(examData);
    await exam.save();

    res.status(201).json(exam);
  } catch (error) {
    res.status(500).json({ message: 'Error creating exam', error: error.message });
  }
});

// Get all exams (with filters)
router.get('/exams', verifyToken, async (req, res) => {
  try {
    const { department, course, status } = req.query;
    const filter = {};

    // Apply filters based on user role
    if (req.user.role === 'student') {
      filter['allowedStudents.student'] = req.user._id;
    } else if (req.user.role === 'faculty') {
      filter.createdBy = req.user._id;
    }

    // Apply additional filters
    if (department) filter.department = department;
    if (course) filter.course = course;
    if (status) filter.status = status;

    const exams = await Exam.find(filter)
      .populate('createdBy', 'name email')
      .populate('questions.question', 'title type points')
      .sort({ startTime: -1 });

    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exams', error: error.message });
  }
});

// Get exam by ID
router.get('/exams/:id', verifyToken, async (req, res) => {
  try {
    const exam = await Exam.findById(req.query.id)
      .populate('createdBy', 'name email')
      .populate('questions.question')
      .populate('allowedStudents.student', 'name email');

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if user has access to this exam
    if (req.user.role === 'student' && 
        !exam.allowedStudents.some(s => s.student._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'You do not have access to this exam' });
    }

    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exam', error: error.message });
  }
});

// Submit exam answers
router.post('/submit-exam/:id', verifyToken, authorize('student'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if student is allowed to take this exam
    const studentExam = exam.allowedStudents.find(
      s => s.student.toString() === req.user._id.toString()
    );
    if (!studentExam) {
      return res.status(403).json({ message: 'You are not registered for this exam' });
    }

    // Check if exam is active
    if (!exam.checkIfActive()) {
      return res.status(400).json({ message: 'Exam is not active' });
    }

    // Create result
    const result = new Result({
      exam: exam._id,
      student: req.user._id,
      answers: req.body.answers,
      startTime: studentExam.startTime,
      endTime: new Date(),
      proctoringData: req.body.proctoringData
    });

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;

    result.answers.forEach(answer => {
      const question = exam.questions.find(q => q.question.toString() === answer.questionId.toString());
      if (question) {
        totalPoints += question.points;
        if (answer.isCorrect) {
          earnedPoints += question.points;
        }
      }
    });

    result.totalPoints = totalPoints;
    result.score = earnedPoints;
    result.percentage = (earnedPoints / totalPoints) * 100;
    result.status = result.percentage >= exam.passingScore ? 'passed' : 'failed';

    await result.save();

    // Update exam statistics
    await exam.updateStatistics(
      result.percentage,
      (result.endTime - result.startTime) / 1000 / 60 // time in minutes
    );

    // Update student status in exam
    await exam.updateStudentStatus(req.user._id, 'completed');

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error submitting exam', error: error.message });
  }
});

module.exports = router; 