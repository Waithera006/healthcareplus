const fileDB = require('../utils/fileDB');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
  static async create(userData) {
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const user = {
      ...userData,
      password: hashedPassword,
      role: userData.role || 'patient',
      isActive: true
    };
    
    return await fileDB.create('users', user);
  }

  static async findByEmail(email) {
    return await fileDB.getByField('users', 'email', email);
  }

  static async findById(id) {
    return await fileDB.getById('users', id);
  }

  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  static async update(id, updateData) {
    // Don't allow updating password via this method
    delete updateData.password;
    return await fileDB.update('users', id, updateData);
  }

  static generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });
  }

  static async getAllUsers() {
    return await fileDB.getAll('users');
  }
}

module.exports = User;