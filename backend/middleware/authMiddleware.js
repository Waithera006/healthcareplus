const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Verify JWT token
exports.verifyToken = async (req, res, next) => {
  let token;
  
  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Get token from cookie
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  // Check if token exists
  if (!token) {
    req.userId = null;
    req.userRole = null;
    return next(); // Allow public access
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      req.userId = null;
      req.userRole = null;
      return next();
    }
    
    // Add user to request object
    req.userId = user.id;
    req.userRole = user.role;
    req.userEmail = user.email;
    next();
  } catch (error) {
    req.userId = null;
    req.userRole = null;
    next();
  }
};

// @desc    Check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      message: 'Please login to access this resource'
    });
  }
  next();
};

// @desc    Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};