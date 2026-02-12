const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middleware/authMiddleware');

// Validation rules
const appointmentValidation = [
    body('patientName').trim().notEmpty().withMessage('Name is required'),
    body('patientEmail').isEmail().withMessage('Please provide a valid email'),
    body('patientPhone').notEmpty().withMessage('Phone number is required'),
    body('department').isIn(['cardiology', 'orthopedics', 'pediatrics', 'emergency', 'maternity', 'general'])
        .withMessage('Please select a valid department'),
    body('message').optional().isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters')
];

// Public route - anyone can book appointment
router.post('/', appointmentValidation, appointmentController.bookAppointment);

// Protected routes
router.get('/my', authMiddleware.verifyToken, appointmentController.getMyAppointments);
router.get('/', authMiddleware.verifyToken, appointmentController.getAppointments);
router.get('/:id', authMiddleware.verifyToken, appointmentController.getAppointment);
router.put('/:id/cancel', authMiddleware.verifyToken, appointmentController.cancelAppointment);

// Admin only routes
router.put('/:id/status', authMiddleware.verifyToken, authMiddleware.isAdmin, appointmentController.updateAppointmentStatus);
router.get('/stats', authMiddleware.verifyToken, authMiddleware.isAdmin, appointmentController.getAppointmentStats);

module.exports = router;