require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'tecwee-super-secret-key-2026';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files - use process.cwd() for Vercel compatibility
const publicPath = process.cwd();
app.use(express.static(publicPath));

// Explicit route for the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// API Endpoint: Submit Contact Form
app.post('/api/contact', async (req, res) => {
  const { firstName, lastName, email, subject, message } = req.body;
  if (!firstName || !lastName || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const { data, error } = await supabase.from('contacts').insert([{ firstName, lastName, email, subject, message }]).select();
  if (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to save message' });
  }
  res.status(201).json({ message: 'Message received successfully', id: data[0].id });
});

// API Endpoint: Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const { data: users, error } = await supabase.from('users').select('id, email, password_hash').eq('email', email).limit(1);
  if (error) return res.status(500).json({ error: 'Database error' });
  const user = users && users.length > 0 ? users[0] : null;
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ message: 'Login successful', token });
});

// Start Server (Vercel uses its own listener, but this is good for local testing)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
