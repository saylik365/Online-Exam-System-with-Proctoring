const Exam = require('../models/exam.model');
const Question = require('../models/question.model');
const User = require('../models/user.model');

// Create a new exam
exports.createExam = async (req, res) => {
  try {
    const examData = {
      ...req.body,
      createdBy: req.user._id,
      status: 'draft',
      isPublished: false
    };

    const exam = new Exam(examData);
    await exam.save();

    res.status(201).json(exam);
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get all exams (with role-based filtering)
exports.getExams = async (req, res) => {
  try {
    let query = {};
    
    // Students can only see published exams they're allowed to take
    if (req.user.role === 'student') {
      query = {
        isPublished: true,
        'allowedStudents.student': req.user._id
      };
    }
    // Faculty/admin can see all exams they created
    else if (req.user.role === 'faculty' || req.user.role === 'admin') {
      query = { createdBy: req.user._id };
    }

    const exams = await Exam.find(query)
      .populate('createdBy', 'name email')
      .sort({ startTime: 1 });

    // Update status of all fetched exams
    await Promise.all(exams.map(exam => exam.updateStatus()));

    res.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get a single exam by ID
exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('questions')
      .populate('allowedStudents.student', 'name email');

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Update exam status
    await exam.updateStatus();

    // Students can only view published exams they're allowed to take
    if (req.user.role === 'student') {
      if (!exam.isPublished) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const isAllowed = exam.allowedStudents.some(
        s => s.student && s.student._id.toString() === req.user._id.toString()
      );
      
      if (!isAllowed) {
        return res.status(403).json({ message: 'You are not registered for this exam' });
      }
    }
    // Faculty/admin can only view their own exams
    else if (['faculty', 'admin'].includes(req.user.role) && 
        exam.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(exam);
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update an exam
exports.updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Only creator can update the exam
    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Cannot update published exams
    if (exam.isPublished) {
      return res.status(400).json({ message: 'Cannot update published exam' });
    }

    // Update exam fields
    Object.assign(exam, req.body);
    await exam.save();
    
    // Populate necessary fields for response
    await exam.populate('createdBy', 'name email');
    await exam.populate('allowedStudents.student', 'name email');
    
    res.json(exam);
  } catch (error) {
    console.error('Error updating exam:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete an exam
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Only creator can delete the exam
    if (exam.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only the creator or admin can delete this exam.' });
    }

    // Cannot delete published or ongoing exams
    if (exam.isPublished || exam.status === 'ongoing' || exam.status === 'completed') {
      return res.status(400).json({ message: 'Cannot delete published or ongoing exams' });
    }

    await Exam.findByIdAndDelete(req.params.id);
    console.log('Exam deleted successfully:', req.params.id);
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({ message: 'Error deleting exam. Please try again.' });
  }
};

// Publish an exam
exports.publishExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Only creator can publish the exam
    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Cannot publish already published exam
    if (exam.isPublished) {
      return res.status(400).json({ message: 'Exam is already published' });
    }

    // Check if exam has all required fields
    if (!exam.title || !exam.description || !exam.subject || !exam.duration || 
        !exam.totalMarks || !exam.passingPercentage || !exam.startTime || !exam.endTime) {
      return res.status(400).json({ message: 'All exam fields must be provided before publishing' });
    }

    // Check if enough questions are available
    const totalQuestionsNeeded = 
      exam.questionCriteria.easy + 
      exam.questionCriteria.medium + 
      exam.questionCriteria.hard;

    if (exam.questions.length < totalQuestionsNeeded) {
      // Fetch random questions based on criteria
      const easyQuestions = await Question.aggregate([
        { $match: { difficulty: 'easy', isUsed: false } },
        { $sample: { size: exam.questionCriteria.easy } }
      ]);

      const mediumQuestions = await Question.aggregate([
        { $match: { difficulty: 'medium', isUsed: false } },
        { $sample: { size: exam.questionCriteria.medium } }
      ]);

      const hardQuestions = await Question.aggregate([
        { $match: { difficulty: 'hard', isUsed: false } },
        { $sample: { size: exam.questionCriteria.hard } }
      ]);

      const selectedQuestions = [...easyQuestions, ...mediumQuestions, ...hardQuestions];

      if (selectedQuestions.length < totalQuestionsNeeded) {
        return res.status(400).json({ 
          message: 'Not enough questions available for the specified criteria' 
        });
      }

      // Mark questions as used and add them to the exam
      exam.questions = selectedQuestions.map(q => q._id);
      await Question.updateMany(
        { _id: { $in: exam.questions } },
        { isUsed: true }
      );
    }

    exam.isPublished = true;
    await exam.updateStatus();
    await exam.save();

    // Populate necessary fields for response
    await exam.populate('createdBy', 'name email');
    await exam.populate('questions');
    await exam.populate('allowedStudents.student', 'name email');

    res.json(exam);
  } catch (error) {
    console.error('Error publishing exam:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add students to exam
exports.addStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Only creator can add students
    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Initialize allowedStudents array if it doesn't exist
    if (!exam.allowedStudents) {
      exam.allowedStudents = [];
    }

    // Handle both email strings and user IDs
    for (const studentIdentifier of studentIds) {
      let studentId;
      
      // If the identifier is not a valid MongoDB ObjectId, treat it as an email
      if (!studentIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
        const student = await User.findOne({ 
          email: studentIdentifier,
          role: 'student'
        });
        
        if (!student) {
          return res.status(404).json({ 
            message: `No student found with email: ${studentIdentifier}` 
          });
        }
        
        studentId = student._id;
      } else {
        studentId = studentIdentifier;
      }

      // Check if student is already registered
      const isRegistered = exam.allowedStudents.some(
        entry => entry.student && entry.student.toString() === studentId.toString()
      );

      if (!isRegistered) {
        exam.allowedStudents.push({
          student: studentId,
          status: 'pending'
        });
      }
    }

    await exam.save();
    
    // Populate student details for response
    await exam.populate('allowedStudents.student', 'name email');
    
    res.json(exam.allowedStudents);
  } catch (error) {
    console.error('Error adding students:', error);
    res.status(500).json({ message: error.message });
  }
};

// Remove students from exam
exports.removeStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Only creator can remove students
    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove students
    exam.allowedStudents = exam.allowedStudents.filter(
      entry => !studentIds.includes(entry.student.toString())
    );

    await exam.save();
    
    // Populate student details for response
    await exam.populate('allowedStudents.student', 'name email');
    
    res.json({
      message: 'Students removed successfully',
      allowedStudents: exam.allowedStudents
    });
  } catch (error) {
    console.error('Error removing students:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get registered students for an exam
exports.getRegisteredStudents = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('allowedStudents.student', 'name email');

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Only creator can view registered students
    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(exam.allowedStudents);
  } catch (error) {
    console.error('Error fetching registered students:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all available students
exports.getAllStudents = async (req, res) => {
  try {
    // Only faculty and admin can fetch all students
    if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const students = await User.find({ 
      role: 'student',
      isActive: true 
    })
    .select('name email')
    .sort({ name: 1 });

    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: error.message });
  }
};

// Start an exam for a student
exports.startExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('questions')
      .populate('allowedStudents.student', 'name email');

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if exam is published
    if (!exam.isPublished) {
      return res.status(403).json({ message: 'This exam is not published yet' });
    }

    // Check if student is allowed to take the exam
    const isAllowed = exam.allowedStudents.some(
      entry => entry.student && entry.student._id.toString() === req.user._id.toString()
    );

    if (!isAllowed) {
      return res.status(403).json({ message: 'You are not registered for this exam' });
    }

    // Check if exam is within the time window
    const now = new Date();
    if (now < exam.startTime) {
      return res.status(403).json({ message: 'This exam has not started yet' });
    }
    if (now > exam.endTime) {
      return res.status(403).json({ message: 'This exam has ended' });
    }

    // Check if student has already started the exam
    const studentEntry = exam.allowedStudents.find(
      entry => entry.student && entry.student._id.toString() === req.user._id.toString()
    );

    if (studentEntry.status === 'completed') {
      return res.status(403).json({ message: 'You have already completed this exam' });
    }

    // Initialize exam session if not already started
    if (studentEntry.status === 'pending') {
      studentEntry.status = 'in-progress';
      studentEntry.startTime = now;
      await exam.save();
    }

    // Return exam details without answers
    const examForStudent = {
      _id: exam._id,
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      startTime: exam.startTime,
      endTime: exam.endTime,
      questions: exam.questions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options,
        type: q.type
      }))
    };

    res.json(examForStudent);
  } catch (error) {
    console.error('Error starting exam:', error);
    res.status(500).json({ message: error.message });
  }
};

// Submit exam answers
exports.submitExam = async (req, res) => {
  try {
    const { answers } = req.body;
    const exam = await Exam.findById(req.params.id)
      .populate('questions')
      .populate('allowedStudents.student', 'name email');

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if student is allowed to take the exam
    const studentEntry = exam.allowedStudents.find(
      entry => entry.student && entry.student._id.toString() === req.user._id.toString()
    );

    if (!studentEntry) {
      return res.status(403).json({ message: 'You are not registered for this exam' });
    }

    // Check if exam is in progress
    if (studentEntry.status !== 'in-progress') {
      return res.status(403).json({ message: 'You have not started this exam or have already submitted it' });
    }

    // Calculate score
    let score = 0;
    const totalQuestions = exam.questions.length;
    
    for (const question of exam.questions) {
      const studentAnswer = answers[question._id];
      
      if (question.type === 'multiple-choice') {
        if (studentAnswer === question.correctAnswer) {
          score += 1;
        }
      } else if (question.type === 'true-false') {
        if (studentAnswer === question.correctAnswer) {
          score += 1;
        }
      }
      // Add more question types as needed
    }

    // Update student's exam status
    studentEntry.status = 'completed';
    studentEntry.endTime = new Date();
    studentEntry.score = (score / totalQuestions) * 100;
    studentEntry.answers = answers;
    
    await exam.save();

    res.json({
      message: 'Exam submitted successfully',
      score: studentEntry.score
    });
  } catch (error) {
    console.error('Error submitting exam:', error);
    res.status(500).json({ message: error.message });
  }
}; 