require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'tecwee-secret-2026';
const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
const SUPPORT_STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];
const RECORD_TYPES = ['lead', 'support'];
const PRIORITIES = ['low', 'normal', 'high', 'urgent'];

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);
const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseKey) : null;

function requireDatabase(req, res, next) {
  if (!hasSupabaseConfig || !supabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
  }
  return next();
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin access required' });
}

function normalizeContact(row) {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    subject: row.subject || '',
    message: row.message || '',
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at,
    record_type: row.record_type || 'lead',
    status: row.status || 'new',
    priority: row.priority || 'normal',
    assigned_to: row.assigned_to || null,
    notes: row.notes || '',
    last_contacted_at: row.last_contacted_at || null,
  };
}

function isStale(row) {
  const status = row.status || 'new';
  if (['won', 'lost', 'resolved', 'closed'].includes(status)) return false;

  const basis = row.last_contacted_at || row.updated_at || row.created_at;
  const ageMs = Date.now() - new Date(basis).getTime();
  return Number.isFinite(ageMs) && ageMs > 2 * 24 * 60 * 60 * 1000;
}

function countBy(rows, getter) {
  return rows.reduce((acc, row) => {
    const key = getter(row) || 'Uncategorized';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function mapCounts(counts, keys) {
  return keys.map((key) => ({ key, label: key.replace(/_/g, ' '), count: counts[key] || 0 }));
}

function dailyTrend(rows) {
  const days = [];
  const now = new Date();

  for (let offset = 6; offset >= 0; offset--) {
    const day = new Date(now);
    day.setDate(now.getDate() - offset);
    const key = day.toISOString().slice(0, 10);
    days.push({ date: key, count: 0 });
  }

  const index = new Map(days.map((day) => [day.date, day]));
  rows.forEach((row) => {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    if (index.has(key)) index.get(key).count += 1;
  });

  return days;
}

function subjectBreakdown(rows) {
  const counts = countBy(rows, (row) => {
    const subject = (row.subject || '').trim();
    if (!subject) return 'No subject';
    return subject.length > 32 ? `${subject.slice(0, 32)}...` : subject;
  });

  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function validateContactPatch(body) {
  const patch = {};
  const recordType = body.record_type || body.recordType;

  if (recordType !== undefined) {
    if (!RECORD_TYPES.includes(recordType)) return { error: 'Invalid record type' };
    patch.record_type = recordType;
  }

  if (body.status !== undefined) {
    const type = patch.record_type || body.currentRecordType || body.record_type || body.recordType || 'lead';
    const allowed = type === 'support' ? SUPPORT_STATUSES : LEAD_STATUSES;
    if (!allowed.includes(body.status)) return { error: 'Invalid status for record type' };
    patch.status = body.status;
  }

  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) return { error: 'Invalid priority' };
    patch.priority = body.priority;
  }

  if (body.assigned_to !== undefined) {
    patch.assigned_to = body.assigned_to === '' || body.assigned_to === null ? null : Number(body.assigned_to);
    if (patch.assigned_to !== null && !Number.isInteger(patch.assigned_to)) {
      return { error: 'Invalid assignee' };
    }
  }

  if (body.notes !== undefined) patch.notes = String(body.notes).slice(0, 4000);

  if (body.last_contacted_at !== undefined) {
    patch.last_contacted_at = body.last_contacted_at || null;
    if (patch.last_contacted_at && Number.isNaN(new Date(patch.last_contacted_at).getTime())) {
      return { error: 'Invalid last contacted date' };
    }
  }

  patch.updated_at = new Date().toISOString();
  return { patch };
}

app.post('/api/contact', requireDatabase, async (req, res) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert([{ firstName, lastName, email, subject, message }])
      .select();

    if (error) throw error;

    return res.status(201).json({
      message: 'Message received successfully',
      id: data && data.length > 0 ? data[0].id : null,
    });
  } catch (err) {
    console.error('Contact Form Error:', err.message);
    return res.status(500).json({ error: 'Failed to save message to database' });
  }
});

app.post('/api/register', requireDatabase, async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let { data, error } = await supabase
      .from('users')
      .insert([{ email: normalizedEmail, password_hash: passwordHash, role: 'client' }])
      .select('id, email, role')
      .single();

    if (error && String(error.message || '').includes('role')) {
      const fallback = await supabase
        .from('users')
        .insert([{ email: normalizedEmail, password_hash: passwordHash }])
        .select('id, email')
        .single();
      data = fallback.data ? { ...fallback.data, role: 'client' } : null;
      error = fallback.error;
    }

    if (error && String(error.message || '').toLowerCase().includes('duplicate')) {
      return res.status(409).json({ error: 'An account already exists for this email' });
    }

    if (error) throw error;

    return res.status(201).json({
      message: 'Account created successfully',
      user: data,
    });
  } catch (err) {
    console.error('Register Error:', err.message);
    return res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/login', requireDatabase, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, role')
      .eq('email', email)
      .single();

    if (error && String(error.message || '').includes('role')) {
      const fallback = await supabase
        .from('users')
        .select('id, email, password_hash')
        .eq('email', email)
        .single();
      user = fallback.data ? { ...fallback.data, role: 'client' } : null;
      error = fallback.error;
    }

    if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const role = user.role || 'client';
    const token = jwt.sign({ userId: user.id, email: user.email, role }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ message: 'Login successful', token, user: { id: user.id, email: user.email, role } });
  } catch (err) {
    console.error('Login Error:', err.message);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

app.get('/api/admin/dashboard', requireDatabase, requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('id, firstName, lastName, email, subject, message, created_at, updated_at, record_type, status, priority, assigned_to, notes, last_contacted_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const rows = (data || []).map(normalizeContact);
    const leadRows = rows.filter((row) => row.record_type === 'lead');
    const supportRows = rows.filter((row) => row.record_type === 'support');
    const staleRows = rows.filter(isStale);
    const statusCounts = countBy(rows, (row) => row.status);

    return res.json({
      kpis: {
        totalRecords: rows.length,
        newLeads: leadRows.filter((row) => row.status === 'new').length,
        openSupport: supportRows.filter((row) => ['open', 'in_progress', 'waiting'].includes(row.status)).length,
        wonLeads: leadRows.filter((row) => row.status === 'won').length,
        staleFollowUps: staleRows.length,
      },
      funnel: mapCounts(statusCounts, LEAD_STATUSES),
      supportStatus: mapCounts(statusCounts, SUPPORT_STATUSES),
      recordTypes: mapCounts(countBy(rows, (row) => row.record_type), RECORD_TYPES),
      dailyTrend: dailyTrend(rows),
      subjectBreakdown: subjectBreakdown(rows),
      staleFollowUps: staleRows.slice(0, 8),
      recentRecords: rows.slice(0, 8),
    });
  } catch (err) {
    console.error('Admin Dashboard Error:', err.message);
    return res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

app.get('/api/admin/contacts', requireDatabase, requireAuth, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    let query = supabase
      .from('contacts')
      .select('id, firstName, lastName, email, subject, message, created_at, updated_at, record_type, status, priority, assigned_to, notes, last_contacted_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (req.query.status) query = query.eq('status', req.query.status);
    if (req.query.recordType) query = query.eq('record_type', req.query.recordType);

    if (req.query.search) {
      const search = String(req.query.search).replace(/[%_,()]/g, '').trim();
      if (search) {
        query = query.or(`firstName.ilike.%${search}%,lastName.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ contacts: (data || []).map(normalizeContact) });
  } catch (err) {
    console.error('Admin Contacts Error:', err.message);
    return res.status(500).json({ error: 'Failed to load contacts' });
  }
});

app.patch('/api/admin/contacts/:id', requireDatabase, requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid contact id' });

    const { data: existing, error: fetchError } = await supabase
      .from('contacts')
      .select('record_type')
      .eq('id', id)
      .single();

    if (fetchError || !existing) return res.status(404).json({ error: 'Contact not found' });

    const validation = validateContactPatch({ ...req.body, currentRecordType: existing.record_type || 'lead' });
    if (validation.error) return res.status(400).json({ error: validation.error });

    const { data, error } = await supabase
      .from('contacts')
      .update(validation.patch)
      .eq('id', id)
      .select('id, firstName, lastName, email, subject, message, created_at, updated_at, record_type, status, priority, assigned_to, notes, last_contacted_at')
      .single();

    if (error) throw error;
    return res.json({ contact: normalizeContact(data) });
  } catch (err) {
    console.error('Admin Contact Update Error:', err.message);
    return res.status(500).json({ error: 'Failed to update contact' });
  }
});

module.exports = app;
