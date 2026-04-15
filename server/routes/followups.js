const express = require('express');
const { prepareAndGet, prepareAndAll, prepareAndRun } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/followups
router.get('/', authenticateToken, (req, res) => {
  try {
    const { status, date_from, date_to } = req.query;

    let where = [];
    let params = [];

    if (req.user.role === 'agent') {
      where.push('fu.user_id = ?');
      params.push(req.user.id);
    }

    if (status) {
      where.push('fu.status = ?');
      params.push(status);
    }
    if (date_from) {
      where.push('fu.followup_date >= ?');
      params.push(date_from);
    }
    if (date_to) {
      where.push('fu.followup_date <= ?');
      params.push(date_to);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const followUps = prepareAndAll(
      `SELECT fu.*, l.name as lead_name, l.phone as lead_phone, l.status as lead_status,
              u.name as user_name
       FROM follow_ups fu
       JOIN leads l ON fu.lead_id = l.id
       JOIN users u ON fu.user_id = u.id
       ${whereClause}
       ORDER BY 
         CASE fu.status WHEN 'pending' THEN 1 WHEN 'missed' THEN 2 WHEN 'completed' THEN 3 END,
         fu.followup_date ASC`,
      ...params
    );

    res.json(followUps);
  } catch (err) {
    console.error('Get follow-ups error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/followups
router.post('/', authenticateToken, (req, res) => {
  try {
    const { lead_id, followup_date, remarks } = req.body;

    if (!lead_id || !followup_date) {
      return res.status(400).json({ error: 'Lead ID and follow-up date are required' });
    }

    const lead = prepareAndGet('SELECT id FROM leads WHERE id = ?', parseInt(lead_id));
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const result = prepareAndRun(
      'INSERT INTO follow_ups (lead_id, user_id, followup_date, remarks) VALUES (?, ?, ?, ?)',
      parseInt(lead_id), req.user.id, followup_date, remarks || null
    );

    const followUp = prepareAndGet(
      `SELECT fu.*, l.name as lead_name, l.phone as lead_phone, u.name as user_name
       FROM follow_ups fu
       JOIN leads l ON fu.lead_id = l.id
       JOIN users u ON fu.user_id = u.id
       WHERE fu.id = ?`,
      result.lastInsertRowid
    );

    res.status(201).json(followUp);
  } catch (err) {
    console.error('Create follow-up error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/followups/:id
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { status, remarks, followup_date } = req.body;
    const id = parseInt(req.params.id);

    const followUp = prepareAndGet('SELECT * FROM follow_ups WHERE id = ?', id);
    if (!followUp) {
      return res.status(404).json({ error: 'Follow-up not found' });
    }

    const updates = [];
    const values = [];

    if (status) { updates.push('status = ?'); values.push(status); }
    if (remarks !== undefined) { updates.push('remarks = ?'); values.push(remarks); }
    if (followup_date) { updates.push('followup_date = ?'); values.push(followup_date); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    prepareAndRun(`UPDATE follow_ups SET ${updates.join(', ')} WHERE id = ?`, ...values);

    const updated = prepareAndGet(
      `SELECT fu.*, l.name as lead_name, l.phone as lead_phone, u.name as user_name
       FROM follow_ups fu
       JOIN leads l ON fu.lead_id = l.id
       JOIN users u ON fu.user_id = u.id
       WHERE fu.id = ?`, id
    );

    res.json(updated);
  } catch (err) {
    console.error('Update follow-up error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
