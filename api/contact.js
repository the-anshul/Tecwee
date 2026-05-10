const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
};
