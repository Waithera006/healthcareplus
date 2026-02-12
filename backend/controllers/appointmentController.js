const Appointment = require('../models/Appointment');
const { validationResult } = require('express-validator');

// @desc    Book new appointment
// @route   POST /api/appointments
// @access  Public
exports.bookAppointment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { patientName, patientEmail, patientPhone, department, message } = req.body;

    // Validate required fields
    if (!patientName || !patientEmail || !patientPhone || !department) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patientName,
      patientEmail,
      patientPhone,
      department,
      message: message || '',
      preferredDate: new Date().toISOString(),
      userId: req.userId || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Generate reference ID
    const reference = `APPT${appointment.id ? appointment.id.slice(-8) : Date.now().toString().slice(-8)}`.toUpperCase();

    res.status(201).json({
      success: true,
      message: 'Appointment request submitted successfully! We will contact you shortly.',
      appointment: {
        id: appointment.id,
        patientName: appointment.patientName,
        department: appointment.department,
        status: appointment.status,
        reference
      }
    });
  } catch (error) {
    console.error('Appointment booking error:', error);
    
    // Even if there's an error, the appointment might have been created
    // Return a success response if we have appointment data
    if (error.appointmentId || (error.result && error.result.id)) {
      const appointmentId = error.appointmentId || error.result.id;
      const reference = `APPT${appointmentId.slice(-8)}`.toUpperCase();
      
      return res.status(201).json({
        success: true,
        message: 'Appointment created successfully!',
        appointment: {
          id: appointmentId,
          reference,
          status: 'pending'
        }
      });
    }
    
    next(error);
  }
};

// @desc    Get all appointments (for authenticated users)
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res, next) => {
  try {
    let appointments;
    
    if (req.userRole === 'admin') {
      // Admin can see all appointments
      appointments = await Appointment.getAll();
    } else {
      // Regular users can only see their appointments
      if (req.userId) {
        appointments = await Appointment.findByUserId(req.userId);
      } else {
        // Fallback: get by email if no userId
        const userEmail = req.userEmail;
        appointments = await Appointment.findByEmail(userEmail);
      }
    }
    
    // Filter by status if provided
    if (req.query.status) {
      appointments = appointments.filter(appt => appt.status === req.query.status);
    }
    
    // Filter by department if provided
    if (req.query.department) {
      appointments = appointments.filter(appt => appt.department === req.query.department);
    }
    
    // Sort by creation date (newest first)
    appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const paginatedAppointments = appointments.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      count: paginatedAppointments.length,
      total: appointments.length,
      pages: Math.ceil(appointments.length / limit),
      currentPage: page,
      appointments: paginatedAppointments
    });
  } catch (error) {
    console.error('Error getting appointments:', error);
    next(error);
  }
};

// @desc    Get current user's appointments
// @route   GET /api/appointments/my
// @access  Private
exports.getMyAppointments = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const appointments = await Appointment.findByUserId(req.userId);
    
    // Sort by creation date (newest first)
    appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Error getting my appointments:', error);
    next(error);
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check authorization
    if (req.userRole !== 'admin' && appointment.userId !== req.userId) {
      // Also check by email for non-logged in users
      const userEmail = req.userEmail;
      if (appointment.patientEmail !== userEmail) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this appointment'
        });
      }
    }
    
    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Error getting appointment:', error);
    next(error);
  }
};

// @desc    Update appointment status (admin only)
// @route   PUT /api/appointments/:id/status
// @access  Private/Admin
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized. Admin privileges required.'
      });
    }

    const { status, notes } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, confirmed, cancelled, or completed'
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update appointment
    const updateData = {
      status: status.toLowerCase(),
      updatedAt: new Date().toISOString()
    };

    if (notes) {
      updateData.notes = notes;
    }

    const updatedAppointment = await Appointment.update(req.params.id, updateData);
    
    res.json({
      success: true,
      message: `Appointment status updated to ${status}`,
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    next(error);
  }
};

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private
exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization (admin or the user who booked it)
    if (req.userRole !== 'admin' && appointment.userId !== req.userId && appointment.patientEmail !== req.userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this appointment'
      });
    }

    // Check if already cancelled
    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled'
      });
    }

    const { reason } = req.body;
    
    const updateData = {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
      notes: reason || `Cancelled by ${req.userRole === 'admin' ? 'admin' : 'patient'}`
    };

    const updatedAppointment = await Appointment.update(req.params.id, updateData);
    
    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    next(error);
  }
};

// @desc    Get appointment statistics (admin only)
// @route   GET /api/appointments/stats
// @access  Private/Admin
exports.getAppointmentStats = async (req, res, next) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized. Admin privileges required.'
      });
    }

    const appointments = await Appointment.getAll();
    
    // Calculate statistics
    const today = new Date().toDateString();
    const todayAppointments = appointments.filter(a => 
      new Date(a.createdAt).toDateString() === today
    );

    // Count by status
    const byStatus = {};
    appointments.forEach(a => {
      const status = a.status || 'pending';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    // Count by department
    const byDepartment = {};
    appointments.forEach(a => {
      const dept = a.department || 'general';
      byDepartment[dept] = (byDepartment[dept] || 0) + 1;
    });

    // Count unique patients
    const uniquePatients = new Set();
    appointments.forEach(a => {
      if (a.patientEmail) uniquePatients.add(a.patientEmail);
    });

    // Count by month (last 6 months)
    const byMonth = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    appointments
      .filter(a => new Date(a.createdAt) >= sixMonthsAgo)
      .forEach(a => {
        const month = new Date(a.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
        byMonth[month] = (byMonth[month] || 0) + 1;
      });

    const stats = {
      total: {
        appointments: appointments.length,
        patients: uniquePatients.size
      },
      today: {
        appointments: todayAppointments.length
      },
      byStatus,
      byDepartment,
      byMonth,
      recent: appointments.slice(0, 5) // Last 5 appointments
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting appointment stats:', error);
    next(error);
  }
};

// @desc    Delete appointment (admin only)
// @route   DELETE /api/appointments/:id
// @access  Private/Admin
exports.deleteAppointment = async (req, res, next) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized. Admin privileges required.'
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    await Appointment.delete(req.params.id);
    
    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    next(error);
  }
};