const express = require('express');
const { prepareAndGet, prepareAndAll, prepareAndRun } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/leads/:leadId/notes
router.get('/leads/:leadId/notes', authenticateToken, (req, res) => {
  try {
    const notes = prepareAndAll(
      `SELECT ln.*, u.name as user_name 
       FROM lead_notes ln 
       JOIN users u ON ln.user_id = u.id 
       WHERE ln.lead_id = ? 
       ORDER BY ln.created_at DESC`,
      parseInt(req.params.leadId)
    );
    res.json(notes);
  } catch (err) {
    console.error('Get notes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/leads/:leadId/notes
router.post('/leads/:leadId/notes', authenticateToken, (req, res) => {
  try {
    const { note_text } = req.body;
    if (!note_text || !note_text.trim()) {
      return res.status(400).json({ error: 'Note text is required' });
    }

    const leadId = parseInt(req.params.leadId);
    const lead = prepareAndGet('SELECT id FROM leads WHERE id = ?', leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const result = prepareAndRun(
      'INSERT INTO lead_notes (lead_id, user_id, note_text) VALUES (?, ?, ?)',
      leadId, req.user.id, note_text.trim()
    );

    const note = prepareAndGet(
      `SELECT ln.*, u.name as user_name 
       FROM lead_notes ln 
       JOIN users u ON ln.user_id = u.id 
       WHERE ln.id = ?`,
      result.lastInsertRowid
    );

    res.status(201).json(note);
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
