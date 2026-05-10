require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tecwee-secret-2026';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the root
// On Vercel, process.cwd() is the root of the project
const root = process.cwd();
app.use(express.static(root));

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// API Endpoint: Submit Contact Form
app.post('/api/contact', async (req, res) => {
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

    res.status(201).json({ 
      message: 'Message received successfully', 
      id: data && data.length > 0 ? data[0].id : null 
    });
  } catch (err) {
    console.error('Contact Form Error:', err.message);
    res.status(500).json({ error: 'Failed to save message to database' });
  }
});

// API Endpoint: Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, password_hash')
      .eq('email', email)
      .single();

    if (error || !users) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, users.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: users.id, email: users.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Explicitly serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(root, 'index.html'));
});

// Serve other HTML pages if requested without extension or with .html
app.get('/:page', (req, res) => {
  const page = req.params.page;
  if (page.endsWith('.html')) {
    res.sendFile(path.join(root, page));
  } else {
    res.sendFile(path.join(root, page + '.html'), (err) => {
      if (err) res.status(404).send('Page not found');
    });
  }
});

// Start Server for local testing
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
