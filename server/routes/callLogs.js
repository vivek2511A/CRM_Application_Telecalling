const express = require('express');
const { prepareAndGet, prepareAndAll, prepareAndRun } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/leads/:leadId/calls
router.get('/leads/:leadId/calls', authenticateToken, (req, res) => {
  try {
    const calls = prepareAndAll(
      `SELECT cl.*, u.name as user_name 
       FROM call_logs cl 
       JOIN users u ON cl.user_id = u.id 
       WHERE cl.lead_id = ? 
       ORDER BY cl.created_at DESC`,
      parseInt(req.params.leadId)
    );
    res.json(calls);
  } catch (err) {
    console.error('Get call logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/calls
router.post('/calls', authenticateToken, (req, res) => {
  try {
    const { lead_id, call_type, call_status, duration, notes } = req.body;

    if (!lead_id) {
      return res.status(400).json({ error: 'Lead ID is required' });
    }

    const leadId = parseInt(lead_id);
    const lead = prepareAndGet('SELECT id, status FROM leads WHERE id = ?', leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const result = prepareAndRun(
      `INSERT INTO call_logs (lead_id, user_id, call_type, call_status, duration, notes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      leadId, req.user.id,
      call_type || 'outbound',
      call_status || 'answered',
      duration || 0,
      notes || null
    );

    // Auto-update lead status if 'new' and call answered
    if (lead.status === 'new' && call_status === 'answered') {
      prepareAndRun(
        'UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        'contacted', leadId
      );
    }

    const call = prepareAndGet(
      `SELECT cl.*, u.name as user_name 
       FROM call_logs cl 
       JOIN users u ON cl.user_id = u.id 
       WHERE cl.id = ?`,
      result.lastInsertRowid
    );

    res.status(201).json(call);
  } catch (err) {
    console.error('Create call log error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/calls - Global call history (with pagination & filters)
router.get('/calls', authenticateToken, (req, res) => {
  try {
    const { page = 1, limit = 20, status, date } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = [];
    let params = [];

    // Agents only see their own calls
    if (req.user.role !== 'admin') {
      where.push('cl.user_id = ?');
      params.push(req.user.id);
    }
    if (status) { where.push('cl.call_status = ?'); params.push(status); }
    if (date) { where.push("DATE(cl.created_at) = ?"); params.push(date); }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const countRow = prepareAndGet(
      `SELECT COUNT(*) as total FROM call_logs cl ${whereClause}`, ...params
    );

    const calls = prepareAndAll(
      `SELECT cl.*, u.name as user_name, l.name as lead_name, l.phone as lead_phone, l.company as lead_company
       FROM call_logs cl
       JOIN users u ON cl.user_id = u.id
       JOIN leads l ON cl.lead_id = l.id
       ${whereClause}
       ORDER BY cl.created_at DESC
       LIMIT ? OFFSET ?`,
      ...params, parseInt(limit), offset
    );

    res.json({
      calls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countRow.total,
        totalPages: Math.ceil(countRow.total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Get all calls error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/calls/queue - Leads that can be called (prioritized by follow-ups & no recent calls)
router.get('/calls/queue', authenticateToken, (req, res) => {
  try {
    let assignedFilter = '';
    let params = [];

    if (req.user.role !== 'admin') {
      assignedFilter = 'AND l.assigned_to = ?';
      params.push(req.user.id);
    }

    const queue = prepareAndAll(
      `SELECT l.id, l.name, l.phone, l.email, l.company, l.status, l.priority, l.source,
              u.name as agent_name,
              (SELECT COUNT(*) FROM call_logs cl WHERE cl.lead_id = l.id) as total_calls,
              (SELECT MAX(cl.created_at) FROM call_logs cl WHERE cl.lead_id = l.id) as last_called,
              (SELECT MIN(f.followup_date) FROM follow_ups f WHERE f.lead_id = l.id AND f.status = 'pending') as next_followup
       FROM leads l
       LEFT JOIN users u ON l.assigned_to = u.id
       WHERE l.status NOT IN ('converted', 'lost') ${assignedFilter}
       ORDER BY 
         CASE WHEN (SELECT MIN(f.followup_date) FROM follow_ups f WHERE f.lead_id = l.id AND f.status = 'pending') <= datetime('now') THEN 0 ELSE 1 END,
         CASE l.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END,
         l.created_at ASC
       LIMIT 50`,
      ...params
    );

    res.json(queue);
  } catch (err) {
    console.error('Get call queue error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/calls/stats - Call statistics for calling portal
router.get('/calls/stats', authenticateToken, (req, res) => {
  try {
    let userFilter = '';
    let params = [];
    if (req.user.role !== 'admin') {
      userFilter = 'AND cl.user_id = ?';
      params.push(req.user.id);
    }

    const today = prepareAndGet(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN call_status = 'answered' THEN 1 ELSE 0 END) as answered,
              SUM(CASE WHEN call_status = 'no_answer' THEN 1 ELSE 0 END) as no_answer,
              SUM(CASE WHEN call_status = 'busy' THEN 1 ELSE 0 END) as busy,
              COALESCE(AVG(CASE WHEN call_status = 'answered' THEN duration END), 0) as avg_duration,
              COALESCE(SUM(duration), 0) as total_duration
       FROM call_logs cl
       WHERE DATE(cl.created_at) = DATE('now') ${userFilter}`,
      ...params
    );

    res.json(today);
  } catch (err) {
    console.error('Get call stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
