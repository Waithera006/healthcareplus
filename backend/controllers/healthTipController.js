const HealthTip = require('../models/HealthTip');

// @desc    Get random health tip
// @route   GET /api/healthtips/random
// @access  Public
exports.getRandomTip = async (req, res, next) => {
  try {
    const tip = await HealthTip.getRandom();
    
    if (!tip) {
      // Fallback tips
      const fallbackTips = [
        "An apple a day keeps the doctor away - they're packed with fiber and antioxidants!",
        "Bananas are rich in potassium, vital for heart health and muscle function.",
        "Drinking 8 glasses of water daily helps maintain proper body function.",
        "Regular exercise for 30 minutes a day can reduce the risk of chronic diseases.",
        "Getting 7-9 hours of sleep each night is essential for physical and mental health."
      ];
      
      const randomTip = fallbackTips[Math.floor(Math.random() * fallbackTips.length)];
      
      return res.json({
        success: true,
        tip: {
          id: 'fallback',
          content: randomTip,
          category: 'general',
          source: 'Healthcare Plus'
        }
      });
    }
    
    res.json({
      success: true,
      tip: {
        id: tip.id,
        content: tip.tip,
        category: tip.category,
        source: tip.source || 'Healthcare Plus Medical Team',
        tags: tip.tags || []
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all health tips (admin)
// @route   GET /api/healthtips
// @access  Private/Admin
exports.getAllTips = async (req, res, next) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const tips = await HealthTip.getAll();
    
    res.json({
      success: true,
      count: tips.length,
      tips
    });
  } catch (error) {
    next(error);
  }
};