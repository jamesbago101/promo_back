const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
require('dotenv').config();

const router = express.Router();

// Hidden admin login route - uses obfuscated path
// This makes it harder for people to find the login page
router.post('/api/v1/auth/verify-access', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const [users] = await pool.query(
      'SELECT * FROM admin_users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token with user role
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.user_role || 'Editor' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.user_role || 'Editor'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint - returns user info including role
router.get('/api/v1/auth/check', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ valid: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user role from database to ensure it's current
    const [users] = await pool.query(
      'SELECT id, username, user_role FROM admin_users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ valid: false });
    }

    res.json({ 
      valid: true,
      user: {
        id: users[0].id,
        username: users[0].username,
        role: users[0].user_role || 'Editor'
      }
    });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;

