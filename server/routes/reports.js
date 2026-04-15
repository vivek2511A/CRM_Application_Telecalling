const express = require('express');
const { prepareAndGet, prepareAndAll } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/dashboard
router.get('/dashboard', authenticateToken, (req, res) => {
  try {
    const isAgent = req.user.role === 'agent';
    const userId = req.user.id;

    // Total leads
    const totalLeads = isAgent
      ? prepareAndGet('SELECT COUNT(*) as count FROM leads WHERE assigned_to = ?', userId)
      : prepareAndGet('SELECT COUNT(*) as count FROM leads');
    
    // Calls today
    const today = new Date().toISOString().split('T')[0];
    const callsToday = isAgent
      ? prepareAndGet('SELECT COUNT(*) as count FROM call_logs WHERE DATE(created_at) = ? AND user_id = ?', today, userId)
      : prepareAndGet('SELECT COUNT(*) as count FROM call_logs WHERE DATE(created_at) = ?', today);

    // Interested leads
    const interestedLeads = isAgent
      ? prepareAndGet("SELECT COUNT(*) as count FROM leads WHERE status = 'interested' AND assigned_to = ?", userId)
      : prepareAndGet("SELECT COUNT(*) as count FROM leads WHERE status = 'interested'");

    // Conversions
    const conversions = isAgent
      ? prepareAndGet("SELECT COUNT(*) as count FROM leads WHERE status = 'converted' AND assigned_to = ?", userId)
      : prepareAndGet("SELECT COUNT(*) as count FROM leads WHERE status = 'converted'");

    // Pending follow-ups
    const pendingFollowUps = isAgent
      ? prepareAndGet("SELECT COUNT(*) as count FROM follow_ups WHERE status = 'pending' AND user_id = ?", userId)
      : prepareAndGet("SELECT COUNT(*) as count FROM follow_ups WHERE status = 'pending'");

    // New leads this week
    const newLeadsThisWeek = isAgent
      ? prepareAndGet("SELECT COUNT(*) as count FROM leads WHERE created_at >= date('now', '-7 days') AND assigned_to = ?", userId)
      : prepareAndGet("SELECT COUNT(*) as count FROM leads WHERE created_at >= date('now', '-7 days')");

    // Recent activities  
    let recentActivities;
    if (isAgent) {
      recentActivities = prepareAndAll(`
        SELECT * FROM (
          SELECT 'call' as type, cl.created_at, cl.call_status as detail, l.name as lead_name, u.name as user_name
          FROM call_logs cl JOIN leads l ON cl.lead_id = l.id JOIN users u ON cl.user_id = u.id
          WHERE cl.user_id = ?
          UNION ALL
          SELECT 'note' as type, ln.created_at, SUBSTR(ln.note_text, 1, 50) as detail, l.name as lead_name, u.name as user_name
          FROM lead_notes ln JOIN leads l ON ln.lead_id = l.id JOIN users u ON ln.user_id = u.id
          WHERE ln.user_id = ?
          UNION ALL
          SELECT 'followup' as type, fu.created_at, fu.status as detail, l.name as lead_name, u.name as user_name
          FROM follow_ups fu JOIN leads l ON fu.lead_id = l.id JOIN users u ON fu.user_id = u.id
          WHERE fu.user_id = ?
        ) ORDER BY created_at DESC LIMIT 10
      `, userId, userId, userId);
    } else {
      recentActivities = prepareAndAll(`
        SELECT * FROM (
          SELECT 'call' as type, cl.created_at, cl.call_status as detail, l.name as lead_name, u.name as user_name
          FROM call_logs cl JOIN leads l ON cl.lead_id = l.id JOIN users u ON cl.user_id = u.id
          UNION ALL
          SELECT 'note' as type, ln.created_at, SUBSTR(ln.note_text, 1, 50) as detail, l.name as lead_name, u.name as user_name
          FROM lead_notes ln JOIN leads l ON ln.lead_id = l.id JOIN users u ON ln.user_id = u.id
          UNION ALL
          SELECT 'followup' as type, fu.created_at, fu.status as detail, l.name as lead_name, u.name as user_name
          FROM follow_ups fu JOIN leads l ON fu.lead_id = l.id JOIN users u ON fu.user_id = u.id
        ) ORDER BY created_at DESC LIMIT 10
      `);
    }

    // Upcoming follow-ups
    const upcomingFollowUps = isAgent
      ? prepareAndAll(`
          SELECT fu.*, l.name as lead_name, l.phone as lead_phone, u.name as user_name
          FROM follow_ups fu JOIN leads l ON fu.lead_id = l.id JOIN users u ON fu.user_id = u.id
          WHERE fu.status = 'pending' AND fu.user_id = ?
          ORDER BY fu.followup_date ASC LIMIT 5`, userId)
      : prepareAndAll(`
          SELECT fu.*, l.name as lead_name, l.phone as lead_phone, u.name as user_name
          FROM follow_ups fu JOIN leads l ON fu.lead_id = l.id JOIN users u ON fu.user_id = u.id
          WHERE fu.status = 'pending'
          ORDER BY fu.followup_date ASC LIMIT 5`);

    // Lead status distribution
    const statusDistribution = isAgent
      ? prepareAndAll('SELECT status, COUNT(*) as count FROM leads WHERE assigned_to = ? GROUP BY status', userId)
      : prepareAndAll('SELECT status, COUNT(*) as count FROM leads GROUP BY status');

    // Weekly call trend
    const callTrend = isAgent
      ? prepareAndAll(`
          SELECT DATE(created_at) as date, COUNT(*) as calls,
                 SUM(CASE WHEN call_status = 'answered' THEN 1 ELSE 0 END) as answered
          FROM call_logs WHERE created_at >= date('now', '-7 days') AND user_id = ?
          GROUP BY DATE(created_at) ORDER BY date ASC`, userId)
      : prepareAndAll(`
          SELECT DATE(created_at) as date, COUNT(*) as calls,
                 SUM(CASE WHEN call_status = 'answered' THEN 1 ELSE 0 END) as answered
          FROM call_logs WHERE created_at >= date('now', '-7 days')
          GROUP BY DATE(created_at) ORDER BY date ASC`);

    res.json({
      kpis: {
        totalLeads: totalLeads?.count || 0,
        callsToday: callsToday?.count || 0,
        interestedLeads: interestedLeads?.count || 0,
        conversions: conversions?.count || 0,
        pendingFollowUps: pendingFollowUps?.count || 0,
        newLeadsThisWeek: newLeadsThisWeek?.count || 0
      },
      recentActivities,
      upcomingFollowUps,
      statusDistribution,
      callTrend
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/agent-performance
router.get('/agent-performance', authenticateToken, (req, res) => {
  try {
    const agents = prepareAndAll(
      "SELECT id, name, email FROM users WHERE role = 'agent' AND is_active = 1 ORDER BY name"
    );

    const result = agents.map(agent => {
      const totalLeads = prepareAndGet('SELECT COUNT(*) as count FROM leads WHERE assigned_to = ?', agent.id);
      const conversions = prepareAndGet("SELECT COUNT(*) as count FROM leads WHERE assigned_to = ? AND status = 'converted'", agent.id);
      const interested = prepareAndGet("SELECT COUNT(*) as count FROM leads WHERE assigned_to = ? AND status = 'interested'", agent.id);
      const totalCalls = prepareAndGet('SELECT COUNT(*) as count FROM call_logs WHERE user_id = ?', agent.id);
      const callsToday = prepareAndGet("SELECT COUNT(*) as count FROM call_logs WHERE user_id = ? AND DATE(created_at) = DATE('now')", agent.id);
      const answeredCalls = prepareAndGet("SELECT COUNT(*) as count FROM call_logs WHERE user_id = ? AND call_status = 'answered'", agent.id);
      const avgDuration = prepareAndGet("SELECT COALESCE(AVG(duration), 0) as avg FROM call_logs WHERE user_id = ? AND call_status = 'answered'", agent.id);
      const completedFollowups = prepareAndGet("SELECT COUNT(*) as count FROM follow_ups WHERE user_id = ? AND status = 'completed'", agent.id);
      const pendingFollowups = prepareAndGet("SELECT COUNT(*) as count FROM follow_ups WHERE user_id = ? AND status = 'pending'", agent.id);

      return {
        ...agent,
        total_leads: totalLeads?.count || 0,
        conversions: conversions?.count || 0,
        interested: interested?.count || 0,
        total_calls: totalCalls?.count || 0,
        calls_today: callsToday?.count || 0,
        answered_calls: answeredCalls?.count || 0,
        avg_call_duration: Math.round(avgDuration?.avg || 0),
        completed_followups: completedFollowups?.count || 0,
        pending_followups: pendingFollowups?.count || 0
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Agent performance error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/call-analytics
router.get('/call-analytics', authenticateToken, (req, res) => {
  try {
    const { period = 'daily' } = req.query;
    const isAgent = req.user.role === 'agent';
    const days = period === 'weekly' ? 28 : 14;

    let analytics, overall;
    if (isAgent) {
      analytics = prepareAndAll(`
        SELECT DATE(created_at) as date, COUNT(*) as total_calls,
               SUM(CASE WHEN call_status = 'answered' THEN 1 ELSE 0 END) as answered,
               SUM(CASE WHEN call_status = 'no_answer' THEN 1 ELSE 0 END) as no_answer,
               SUM(CASE WHEN call_status = 'busy' THEN 1 ELSE 0 END) as busy,
               SUM(CASE WHEN call_status = 'voicemail' THEN 1 ELSE 0 END) as voicemail,
               COALESCE(AVG(CASE WHEN call_status = 'answered' THEN duration END), 0) as avg_duration
        FROM call_logs WHERE created_at >= date('now', '-${days} days') AND user_id = ?
        GROUP BY DATE(created_at) ORDER BY date ASC
      `, req.user.id);

      overall = prepareAndGet(`
        SELECT COUNT(*) as total_calls,
               SUM(CASE WHEN call_status = 'answered' THEN 1 ELSE 0 END) as answered,
               ROUND(100.0 * SUM(CASE WHEN call_status = 'answered' THEN 1 ELSE 0 END) / MAX(COUNT(*), 1), 1) as answer_rate,
               COALESCE(AVG(CASE WHEN call_status = 'answered' THEN duration END), 0) as avg_duration
        FROM call_logs WHERE created_at >= date('now', '-${days} days') AND user_id = ?
      `, req.user.id);
    } else {
      analytics = prepareAndAll(`
        SELECT DATE(created_at) as date, COUNT(*) as total_calls,
               SUM(CASE WHEN call_status = 'answered' THEN 1 ELSE 0 END) as answered,
               SUM(CASE WHEN call_status = 'no_answer' THEN 1 ELSE 0 END) as no_answer,
               SUM(CASE WHEN call_status = 'busy' THEN 1 ELSE 0 END) as busy,
               SUM(CASE WHEN call_status = 'voicemail' THEN 1 ELSE 0 END) as voicemail,
               COALESCE(AVG(CASE WHEN call_status = 'answered' THEN duration END), 0) as avg_duration
        FROM call_logs WHERE created_at >= date('now', '-${days} days')
        GROUP BY DATE(created_at) ORDER BY date ASC
      `);

      overall = prepareAndGet(`
        SELECT COUNT(*) as total_calls,
               SUM(CASE WHEN call_status = 'answered' THEN 1 ELSE 0 END) as answered,
               ROUND(100.0 * SUM(CASE WHEN call_status = 'answered' THEN 1 ELSE 0 END) / MAX(COUNT(*), 1), 1) as answer_rate,
               COALESCE(AVG(CASE WHEN call_status = 'answered' THEN duration END), 0) as avg_duration
        FROM call_logs WHERE created_at >= date('now', '-${days} days')
      `);
    }

    res.json({ analytics, overall });
  } catch (err) {
    console.error('Call analytics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/conversion-rates
router.get('/conversion-rates', authenticateToken, (req, res) => {
  try {
    const bySource = prepareAndAll(`
      SELECT source, COUNT(*) as total,
             SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted,
             ROUND(100.0 * SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) / MAX(COUNT(*), 1), 1) as rate
      FROM leads GROUP BY source ORDER BY rate DESC
    `);

    const byAgent = prepareAndAll(`
      SELECT u.name as agent_name, COUNT(l.id) as total_leads,
             SUM(CASE WHEN l.status = 'converted' THEN 1 ELSE 0 END) as converted,
             ROUND(100.0 * SUM(CASE WHEN l.status = 'converted' THEN 1 ELSE 0 END) / MAX(COUNT(l.id), 1), 1) as rate
      FROM users u LEFT JOIN leads l ON l.assigned_to = u.id
      WHERE u.role = 'agent' AND u.is_active = 1
      GROUP BY u.id ORDER BY rate DESC
    `);

    const funnel = prepareAndAll(`
      SELECT status, COUNT(*) as count FROM leads GROUP BY status
      ORDER BY CASE status 
        WHEN 'new' THEN 1 WHEN 'contacted' THEN 2 WHEN 'interested' THEN 3 
        WHEN 'qualified' THEN 4 WHEN 'converted' THEN 5 WHEN 'lost' THEN 6 END
    `);

    res.json({ bySource, byAgent, funnel });
  } catch (err) {
    console.error('Conversion rates error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
