const express = require('express');
const { prepareAndGet, prepareAndAll, prepareAndRun } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/leads - List leads with filters, search, pagination
router.get('/', authenticateToken, (req, res) => {
  try {
    const { status, source, assigned_to, search, page = 1, limit = 20, sort = 'created_at', order = 'DESC' } = req.query;

    let where = [];
    let params = [];

    if (req.user.role === 'agent') {
      where.push('l.assigned_to = ?');
      params.push(req.user.id);
    } else if (assigned_to) {
      where.push('l.assigned_to = ?');
      params.push(parseInt(assigned_to));
    }

    if (status) {
      where.push('l.status = ?');
      params.push(status);
    }
    if (source) {
      where.push('l.source = ?');
      params.push(source);
    }
    if (search) {
      where.push('(l.name LIKE ? OR l.email LIKE ? OR l.phone LIKE ? OR l.company LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const validSortFields = ['created_at', 'name', 'status', 'priority', 'updated_at'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = prepareAndGet(`SELECT COUNT(*) as count FROM leads l ${whereClause}`, ...params);
    const total = countResult?.count || 0;

    const leads = prepareAndAll(
      `SELECT l.*, u.name as agent_name 
       FROM leads l 
       LEFT JOIN users u ON l.assigned_to = u.id 
       ${whereClause} 
       ORDER BY l.${sortField} ${sortOrder} 
       LIMIT ? OFFSET ?`,
      ...params, parseInt(limit), offset
    );

    res.json({
      leads,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Get leads error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leads/:id - Get single lead with related data
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const lead = prepareAndGet(
      `SELECT l.*, u.name as agent_name 
       FROM leads l 
       LEFT JOIN users u ON l.assigned_to = u.id 
       WHERE l.id = ?`, id
    );

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const notes = prepareAndAll(
      `SELECT ln.*, u.name as user_name 
       FROM lead_notes ln 
       JOIN users u ON ln.user_id = u.id 
       WHERE ln.lead_id = ? 
       ORDER BY ln.created_at DESC`, id
    );

    const callLogs = prepareAndAll(
      `SELECT cl.*, u.name as user_name 
       FROM call_logs cl 
       JOIN users u ON cl.user_id = u.id 
       WHERE cl.lead_id = ? 
       ORDER BY cl.created_at DESC`, id
    );

    const followUps = prepareAndAll(
      `SELECT fu.*, u.name as user_name 
       FROM follow_ups fu 
       JOIN users u ON fu.user_id = u.id 
       WHERE fu.lead_id = ? 
       ORDER BY fu.followup_date DESC`, id
    );

    res.json({ ...lead, notes, callLogs, followUps });
  } catch (err) {
    console.error('Get lead error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leads/:id/next - Get next lead suggestion for auto-dialer
router.get('/:id/next', authenticateToken, (req, res) => {
  try {
    const currentId = parseInt(req.params.id);

    let query, params;
    if (req.user.role === 'agent') {
      query = `SELECT l.*, u.name as agent_name 
               FROM leads l 
               LEFT JOIN users u ON l.assigned_to = u.id 
               WHERE l.id != ? AND l.assigned_to = ? AND l.status IN ('new', 'contacted', 'interested') 
               ORDER BY 
                 CASE l.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
                 l.created_at ASC 
               LIMIT 1`;
      params = [currentId, req.user.id];
    } else {
      query = `SELECT l.*, u.name as agent_name 
               FROM leads l 
               LEFT JOIN users u ON l.assigned_to = u.id 
               WHERE l.id != ? AND l.status IN ('new', 'contacted', 'interested') 
               ORDER BY 
                 CASE l.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
                 l.created_at ASC 
               LIMIT 1`;
      params = [currentId];
    }

    const nextLead = prepareAndGet(query, ...params);

    if (!nextLead) {
      return res.json({ message: 'No more leads to call', lead: null });
    }

    res.json({ lead: nextLead });
  } catch (err) {
    console.error('Get next lead error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/leads - Create lead
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, phone, email, source, status, assigned_to, company, priority } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const result = prepareAndRun(
      `INSERT INTO leads (name, phone, email, source, status, assigned_to, company, priority) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      name, phone, email || null, source || 'other', status || 'new',
      assigned_to || null, company || null, priority || 'medium'
    );

    const lead = prepareAndGet(
      `SELECT l.*, u.name as agent_name 
       FROM leads l 
       LEFT JOIN users u ON l.assigned_to = u.id 
       WHERE l.id = ?`, result.lastInsertRowid
    );

    res.status(201).json(lead);
  } catch (err) {
    console.error('Create lead error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/leads/:id - Update lead
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const lead = prepareAndGet('SELECT * FROM leads WHERE id = ?', id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const { name, phone, email, source, status, assigned_to, company, priority } = req.body;

    const updates = [];
    const values = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (phone) { updates.push('phone = ?'); values.push(phone); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (source) { updates.push('source = ?'); values.push(source); }
    if (status) { updates.push('status = ?'); values.push(status); }
    if (assigned_to !== undefined) { updates.push('assigned_to = ?'); values.push(assigned_to); }
    if (company !== undefined) { updates.push('company = ?'); values.push(company); }
    if (priority) { updates.push('priority = ?'); values.push(priority); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    prepareAndRun(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`, ...values);

    const updated = prepareAndGet(
      `SELECT l.*, u.name as agent_name 
       FROM leads l 
       LEFT JOIN users u ON l.assigned_to = u.id 
       WHERE l.id = ?`, id
    );

    res.json(updated);
  } catch (err) {
    console.error('Update lead error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/leads/:id - Delete lead
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const lead = prepareAndGet('SELECT * FROM leads WHERE id = ?', id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    prepareAndRun('DELETE FROM leads WHERE id = ?', id);
    res.json({ message: 'Lead deleted successfully' });
  } catch (err) {
    console.error('Delete lead error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
