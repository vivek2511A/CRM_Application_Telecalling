const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'crm.db');

let db = null;
let dbReady = null;

function getDb() {
  return db;
}

async function initializeDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Run schema
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  db.run(schema);

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Check if seed data is needed
  const result = db.exec('SELECT COUNT(*) as count FROM users');
  const userCount = result[0]?.values[0]?.[0] || 0;

  if (userCount === 0) {
    seedDatabase(db);
  }

  // Save to disk
  saveDatabase();

  console.log('✅ Database initialized successfully');
  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Helper functions to mimic better-sqlite3 API
function prepareAndGet(sql, ...params) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return undefined;
}

function prepareAndAll(sql, ...params) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function prepareAndRun(sql, ...params) {
  db.run(sql, params);
  saveDatabase();
  const lastId = db.exec('SELECT last_insert_rowid()')[0]?.values[0]?.[0];
  const changes = db.getRowsModified();
  return { lastInsertRowid: lastId, changes };
}

function seedDatabase(database) {
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const agentPassword = bcrypt.hashSync('agent123', 10);

  // Create users
  db.run('INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
    ['Admin User', 'admin@crm.com', adminPassword, 'admin', '+1-555-0100']);
  db.run('INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
    ['Sarah Johnson', 'sarah@crm.com', agentPassword, 'agent', '+1-555-0101']);
  db.run('INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
    ['Mike Chen', 'mike@crm.com', agentPassword, 'agent', '+1-555-0102']);
  db.run('INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
    ['Emily Davis', 'emily@crm.com', agentPassword, 'agent', '+1-555-0103']);

  // Create leads
  const leads = [
    ['John Smith', '+1-555-1001', 'john.smith@email.com', 'website', 'new', 2, 'Acme Corp', 'high'],
    ['Lisa Wang', '+1-555-1002', 'lisa.wang@email.com', 'referral', 'contacted', 2, 'TechStart Inc', 'medium'],
    ['Robert Brown', '+1-555-1003', 'robert.b@email.com', 'social_media', 'interested', 3, 'Global Solutions', 'high'],
    ['Maria Garcia', '+1-555-1004', 'maria.g@email.com', 'cold_call', 'qualified', 2, 'Sunrise LLC', 'medium'],
    ['David Lee', '+1-555-1005', 'david.lee@email.com', 'advertisement', 'converted', 3, 'Peak Systems', 'low'],
    ['Jennifer Taylor', '+1-555-1006', 'jen.t@email.com', 'website', 'new', 4, 'Nova Enterprises', 'high'],
    ['Michael Wilson', '+1-555-1007', 'mwilson@email.com', 'referral', 'contacted', 2, 'Blue Ocean Co', 'medium'],
    ['Amanda Martinez', '+1-555-1008', 'amanda.m@email.com', 'social_media', 'interested', 3, 'DataDriven Ltd', 'high'],
    ['Chris Anderson', '+1-555-1009', 'chris.a@email.com', 'cold_call', 'lost', 4, 'FastTrack Inc', 'low'],
    ['Nicole Thomas', '+1-555-1010', 'nicole.t@email.com', 'website', 'new', 2, 'Bright Ideas Co', 'medium'],
    ['James Jackson', '+1-555-1011', 'james.j@email.com', 'advertisement', 'contacted', 3, 'Vertex Solutions', 'high'],
    ['Sarah White', '+1-555-1012', 'sarah.w@email.com', 'referral', 'qualified', 4, 'Pinnacle Group', 'medium'],
    ['Kevin Harris', '+1-555-1013', 'kevin.h@email.com', 'cold_call', 'interested', 2, 'CoreTech Systems', 'high'],
    ['Rachel Clark', '+1-555-1014', 'rachel.c@email.com', 'website', 'new', 3, 'Fusion Dynamics', 'low'],
    ['Daniel Lewis', '+1-555-1015', 'daniel.l@email.com', 'social_media', 'converted', 4, 'Echo Innovations', 'medium'],
    ['Megan Robinson', '+1-555-1016', 'megan.r@email.com', 'advertisement', 'contacted', 2, 'Quantum Labs', 'high'],
    ['Andrew Walker', '+1-555-1017', 'andrew.w@email.com', 'referral', 'new', 3, 'Shield Security', 'medium'],
    ['Laura Hall', '+1-555-1018', 'laura.h@email.com', 'cold_call', 'interested', 4, 'Orbit Media', 'high'],
    ['Brian Allen', '+1-555-1019', 'brian.a@email.com', 'website', 'qualified', 2, 'NexGen Corp', 'low'],
    ['Samantha Young', '+1-555-1020', 'sam.y@email.com', 'social_media', 'new', 3, 'Catalyst Group', 'medium'],
  ];

  for (const lead of leads) {
    db.run(
      'INSERT INTO leads (name, phone, email, source, status, assigned_to, company, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      lead
    );
  }

  // Create call logs
  const callLogs = [
    [1, 2, 'outbound', 'no_answer', 0, 'No answer, will try again', '2026-04-09 10:30:00'],
    [2, 2, 'outbound', 'answered', 185, 'Discussed pricing plans, interested in premium', '2026-04-09 11:15:00'],
    [3, 3, 'outbound', 'answered', 420, 'Deep dive into features, very interested', '2026-04-09 14:00:00'],
    [4, 2, 'outbound', 'answered', 300, 'Qualified lead, ready for demo', '2026-04-08 09:30:00'],
    [5, 3, 'outbound', 'answered', 600, 'Closed the deal, converted!', '2026-04-07 16:00:00'],
    [6, 4, 'outbound', 'busy', 0, 'Line busy, scheduled callback', '2026-04-09 13:00:00'],
    [7, 2, 'outbound', 'answered', 150, 'Initial contact made, sent brochure', '2026-04-08 11:00:00'],
    [8, 3, 'outbound', 'answered', 350, 'Follow-up call, showing strong interest', '2026-04-09 15:30:00'],
    [9, 4, 'outbound', 'no_answer', 0, 'Multiple attempts, no response', '2026-04-06 10:00:00'],
    [10, 2, 'outbound', 'voicemail', 30, 'Left voicemail with callback number', '2026-04-09 09:00:00'],
    [1, 2, 'outbound', 'answered', 240, 'Second attempt successful, interested in basic plan', '2026-04-10 10:00:00'],
    [11, 3, 'outbound', 'answered', 180, 'Initial discussion, needs time to decide', '2026-04-10 09:30:00'],
    [13, 2, 'outbound', 'answered', 270, 'Strong interest, wants a demo next week', '2026-04-10 11:00:00'],
  ];

  for (const call of callLogs) {
    db.run(
      'INSERT INTO call_logs (lead_id, user_id, call_type, call_status, duration, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      call
    );
  }

  // Create notes
  const notes = [
    [1, 2, 'Initial outreach - no answer. Will try again tomorrow.', '2026-04-09 10:35:00'],
    [1, 2, 'Connected on second attempt. Interested in basic plan. Sent pricing info.', '2026-04-10 10:05:00'],
    [2, 2, 'Very responsive. Comparing us vs competitors. Needs enterprise features.', '2026-04-09 11:25:00'],
    [3, 3, 'CTO involvement. Wants technical deep-dive. Scheduled for next week.', '2026-04-09 14:15:00'],
    [4, 2, 'Budget approved. Ready for onboarding demo.', '2026-04-08 09:45:00'],
    [5, 3, 'Deal closed! 12-month contract signed. Premium tier.', '2026-04-07 16:10:00'],
    [8, 3, 'Decision maker engaged. Proposal sent.', '2026-04-09 15:45:00'],
    [13, 2, 'Very enthusiastic. Wants demo with their full team.', '2026-04-10 11:15:00'],
  ];

  for (const note of notes) {
    db.run(
      'INSERT INTO lead_notes (lead_id, user_id, note_text, created_at) VALUES (?, ?, ?, ?)',
      note
    );
  }

  // Create follow-ups
  const followUps = [
    [1, 2, '2026-04-11 10:00:00', 'pending', 'Follow up on pricing inquiry', '2026-04-10 10:05:00'],
    [3, 3, '2026-04-11 14:00:00', 'pending', 'Technical deep-dive session', '2026-04-09 14:15:00'],
    [6, 4, '2026-04-10 15:00:00', 'pending', 'Callback - line was busy', '2026-04-09 13:05:00'],
    [8, 3, '2026-04-12 11:00:00', 'pending', 'Follow up on proposal', '2026-04-09 15:45:00'],
    [13, 2, '2026-04-14 10:00:00', 'pending', 'Team demo scheduled', '2026-04-10 11:15:00'],
    [4, 2, '2026-04-09 10:00:00', 'completed', 'Demo completed successfully', '2026-04-08 09:45:00'],
    [5, 3, '2026-04-07 15:00:00', 'completed', 'Final negotiation call', '2026-04-06 16:00:00'],
    [9, 4, '2026-04-08 10:00:00', 'missed', 'Could not reach, lead gone cold', '2026-04-06 10:05:00'],
    [10, 2, '2026-04-10 14:00:00', 'pending', 'Waiting for callback after voicemail', '2026-04-09 09:05:00'],
    [7, 2, '2026-04-10 11:00:00', 'pending', 'Check if brochure was reviewed', '2026-04-08 11:05:00'],
  ];

  for (const fu of followUps) {
    db.run(
      'INSERT INTO follow_ups (lead_id, user_id, followup_date, status, remarks, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      fu
    );
  }

  saveDatabase();
  console.log('🌱 Database seeded with sample data');
}

module.exports = { getDb, initializeDatabase, prepareAndGet, prepareAndAll, prepareAndRun, saveDatabase };
