const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const auth = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

// Get all users (Admin only)
router.get('/api/v1/users', auth, async (req, res) => {
  try {
    // Check if user is Admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const [users] = await pool.query(
      'SELECT id, username, user_role, created_at, updated_at FROM admin_users ORDER BY created_at DESC'
    );

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single user (Admin only)
router.get('/api/v1/users/:id', auth, async (req, res) => {
  try {
    // Check if user is Admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const [users] = await pool.query(
      'SELECT id, username, user_role, created_at, updated_at FROM admin_users WHERE id = ?',
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user (Admin only)
router.post('/api/v1/users', auth, async (req, res) => {
  try {
    // Check if user is Admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { username, password, user_role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (!user_role || !['Admin', 'Editor'].includes(user_role)) {
      return res.status(400).json({ error: 'Valid user_role (Admin or Editor) is required' });
    }

    // Check if username already exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM admin_users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO admin_users (username, password_hash, user_role) VALUES (?, ?, ?)',
      [username, passwordHash, user_role]
    );

    res.status(201).json({
      id: result.insertId,
      username,
      user_role,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (Admin only)
router.put('/api/v1/users/:id', auth, async (req, res) => {
  try {
    // Check if user is Admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { username, password, user_role } = req.body;

    // Check if user exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM admin_users WHERE id = ?',
      [req.params.id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = [];
    const values = [];

    // Update username if provided
    if (username) {
      // Check if new username already exists (excluding current user)
      const [duplicateUsers] = await pool.query(
        'SELECT * FROM admin_users WHERE username = ? AND id != ?',
        [username, req.params.id]
      );

      if (duplicateUsers.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      updates.push('username = ?');
      values.push(username);
    }

    // Update password if provided
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      values.push(passwordHash);
    }

    // Update role if provided
    if (user_role && ['Admin', 'Editor'].includes(user_role)) {
      // Prevent changing the last Admin user's role to Editor
      if (user_role === 'Editor' && existingUsers[0].user_role === 'Admin') {
        const [adminUsers] = await pool.query(
          'SELECT * FROM admin_users WHERE user_role = ?',
          ['Admin']
        );
        
        if (adminUsers.length === 1) {
          return res.status(400).json({ 
            error: 'Cannot change the role of the last remaining Admin user to Editor. At least one Admin user must exist in the system.' 
          });
        }
      }
      
      updates.push('user_role = ?');
      values.push(user_role);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.params.id);

    await pool.query(
      `UPDATE admin_users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (Admin only)
router.delete('/api/v1/users/:id', auth, async (req, res) => {
  try {
    // Check if user is Admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    // Prevent deleting yourself
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM admin_users WHERE id = ?',
      [req.params.id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userToDelete = existingUsers[0];

    // Prevent deleting the last Admin user
    if (userToDelete.user_role === 'Admin') {
      const [allUsers] = await pool.query('SELECT * FROM admin_users WHERE user_role = ?', ['Admin']);
      
      if (allUsers.length === 1) {
        return res.status(400).json({ error: 'Cannot delete the last remaining Admin user. At least one Admin user must exist in the system.' });
      }
    }

    await pool.query('DELETE FROM admin_users WHERE id = ?', [req.params.id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

