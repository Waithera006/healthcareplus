const fileDB = require('../utils/fileDB');

class HealthTip {
  static async create(tipData) {
    const tip = {
      ...tipData,
      isActive: true,
      views: 0,
      lastDisplayed: null
    };
    
    return await fileDB.create('healthtips', tip);
  }

  static async getRandom() {
    const tips = await fileDB.getAll('healthtips');
    const activeTips = tips.filter(tip => tip.isActive);
    
    if (activeTips.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * activeTips.length);
    const selectedTip = activeTips[randomIndex];
    
    // Update view count
    selectedTip.views = (selectedTip.views || 0) + 1;
    selectedTip.lastDisplayed = new Date().toISOString();
    
    await fileDB.update('healthtips', selectedTip.id, {
      views: selectedTip.views,
      lastDisplayed: selectedTip.lastDisplayed
    });
    
    return selectedTip;
  }

  static async getAll() {
    return await fileDB.getAll('healthtips');
  }

  static async getByCategory(category) {
    const tips = await fileDB.getAll('healthtips');
    return tips.filter(tip => 
      tip.category === category && tip.isActive
    );
  }

  static async update(id, updateData) {
    return await fileDB.update('healthtips', id, updateData);
  }

  static async delete(id) {
    return await fileDB.remove('healthtips', id);
  }
}

module.exports = HealthTip;