const express = require('express');
const bcrypt = require('bcryptjs');
const { prepareAndGet, prepareAndAll, prepareAndRun } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - List all users (admin only)
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const users = prepareAndAll(
      'SELECT id, name, email, role, phone, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/agents - List agents only
router.get('/agents', authenticateToken, (req, res) => {
  try {
    const agents = prepareAndAll(
      "SELECT id, name, email, phone FROM users WHERE role = 'agent' AND is_active = 1 ORDER BY name"
    );
    res.json(agents);
  } catch (err) {
    console.error('Get agents error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users - Create user (admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = prepareAndGet('SELECT id FROM users WHERE email = ?', email);
    if (existing) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = prepareAndRun(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      name, email, hashedPassword, role || 'agent', phone || null
    );

    const user = prepareAndGet(
      'SELECT id, name, email, role, phone, is_active, created_at FROM users WHERE id = ?',
      result.lastInsertRowid
    );

    res.status(201).json(user);
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, email, password, role, phone, is_active } = req.body;

    const user = prepareAndGet('SELECT * FROM users WHERE id = ?', parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = [];
    const values = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (email) { updates.push('email = ?'); values.push(email); }
    if (password) { updates.push('password = ?'); values.push(bcrypt.hashSync(password, 10)); }
    if (role) { updates.push('role = ?'); values.push(role); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(parseInt(req.params.id));

    prepareAndRun(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, ...values);

    const updated = prepareAndGet(
      'SELECT id, name, email, role, phone, is_active, created_at FROM users WHERE id = ?',
      parseInt(req.params.id)
    );

    res.json(updated);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/:id - Deactivate user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const user = prepareAndGet('SELECT * FROM users WHERE id = ?', parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    prepareAndRun('UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      parseInt(req.params.id));

    res.json({ message: 'User deactivated successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
