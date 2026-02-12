const express = require('express');
const router = express.Router();
const healthTipController = require('../controllers/healthTipController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/random', healthTipController.getRandomTip);

// Admin only routes
router.get('/', authMiddleware.verifyToken, authMiddleware.isAdmin, healthTipController.getAllTips);
router.post('/', authMiddleware.verifyToken, authMiddleware.isAdmin, healthTipController.createTip);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, healthTipController.updateTip);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, healthTipController.deleteTip);

module.exports = router;