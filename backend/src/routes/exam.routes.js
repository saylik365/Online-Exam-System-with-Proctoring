const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const examController = require('../controllers/exam.controller');
const { verifyAuth, isTeacher, isStudent } = require('../middleware/auth');
const { validateRequest } = require('../middleware/security');
const Exam = require('../models/exam.model');
const Submission = require('../models/submission.model');
const Proctoring = require('../models/proctoring.model');

// Protected routes - all routes require authentication
router.use(verifyAuth);

// Exam validation middleware
const validateExam = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 minute'),
  body('startTime').isISO8601().withMessage('Invalid start time format'),
  body('endTime').isISO8601().withMessage('Invalid end time format'),
  body('questions').isArray().withMessage('Questions must be an array'),
  body('questions.*').isMongoId().withMessage('Invalid question ID'),
  validateRequest
];

// Routes that don't need specific exam ID
router.get('/', examController.getExams);
router.post('/', [isTeacher, validateExam], examController.createExam);
router.get('/available-students', isTeacher, examController.getAllStudents);

// Routes that need specific exam ID
router.get('/:id', examController.getExamById);
router.put('/:id', [isTeacher, validateExam], examController.updateExam);
router.delete('/:id', isTeacher, examController.deleteExam);

// Student registration routes
router.get('/:id/students', isTeacher, examController.getRegisteredStudents);
router.post('/:id/students', [
  isTeacher,
  body('studentIds').isArray().withMessage('Student IDs must be an array'),
  body('studentIds.*').isMongoId().withMessage('Invalid student ID'),
  validateRequest
], examController.addStudents);

router.delete('/:id/students', [
  isTeacher,
  body('studentIds').isArray().withMessage('Student IDs must be an array'),
  body('studentIds.*').isMongoId().withMessage('Invalid student ID'),
  validateRequest
], examController.removeStudents);

// Exam participation routes
router.post('/:id/start', isStudent, examController.startExam);
router.post('/:id/submit', [
  isStudent,
  body('answers').isArray().withMessage('Answers must be an array'),
  validateRequest
], examController.submitExam);
router.post('/:id/publish', isTeacher, examController.publishExam);

module.exports = router; 