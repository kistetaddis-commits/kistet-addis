const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'kistet_addis_super_secret_key_2025';

// Database Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

// Configure Multer for dummy uploads
const upload = multer({ dest: 'uploads/' });

// --- Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  next();
};

const isStaff = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
    return res.status(403).json({ error: 'Staff access required.' });
  }
  next();
};

// --- Auth Routes ---

app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body;
  try {
    // Special case for default admin
    if (identifier === 'KistetAddis' && password === '12345678') {
      const userResult = await pool.query('SELECT * FROM users WHERE email = $1 OR name = $2', [identifier, identifier]);
      const user = userResult.rows[0];
      if (user) {
        const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
      }
    }

    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR name = $2',
      [identifier, identifier]
    );

    const user = userResult.rows[0];
    if (!user) return res.status(400).json({ error: 'Invalid username/email or password.' });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid username/email or password.' });

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching user.' });
  }
});

app.patch('/api/auth/profile', authenticateToken, async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let query = 'UPDATE users SET name = $1, email = $2';
    let params = [name, email, req.user.id];
    
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      query += ', password_hash = $4 WHERE id = $3';
      params.push(passwordHash);
    } else {
      query += ' WHERE id = $3';
    }
    
    await pool.query(query, params);
    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});

// --- Event Routes ---

app.get('/api/events', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events ORDER BY date ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching events.' });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching event.' });
  }
});

app.post('/api/events', authenticateToken, isAdmin, async (req, res) => {
  const { title, description, date, location, latitude, longitude, price, total_tickets, image_url } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO events (title, description, date, location, latitude, longitude, price, total_tickets, image_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [title, description, date, location, latitude, longitude, price, total_tickets, image_url, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating event.' });
  }
});

app.delete('/api/events/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    res.json({ message: 'Event deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting event.' });
  }
});

// --- Ticket & Payment Routes ---

app.post('/api/tickets', async (req, res) => {
  const { event_id, user_name, phone, email, quantity } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO tickets (event_id, user_name, phone, email, quantity, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [event_id, user_name, phone, email, quantity]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating ticket.' });
  }
});

app.post('/api/payments', async (req, res) => {
  const { ticket_id, method, transaction_id, amount } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO payments (ticket_id, method, transaction_id, status, amount)
       VALUES ($1, $2, $3, 'pending', $4) RETURNING *`,
      [ticket_id, method, transaction_id, amount]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error submitting payment.' });
  }
});

app.get('/api/admin/payments/pending', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, t.user_name, t.phone, t.email, e.title as event_title
      FROM payments p
      JOIN tickets t ON p.ticket_id = t.id
      JOIN events e ON t.event_id = e.id
      WHERE p.status = 'pending'
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching pending payments.' });
  }
});

app.patch('/api/admin/payments/:id/verify', authenticateToken, isAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const paymentResult = await client.query('UPDATE payments SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
      const payment = paymentResult.rows[0];
      if (!payment) throw new Error('Payment not found.');

      if (status === 'approved') {
        const ticketWithEvent = await client.query(`SELECT t.*, e.title, e.date, e.location FROM tickets t JOIN events e ON t.event_id = e.id WHERE t.id = $1`, [payment.ticket_id]);
        const t = ticketWithEvent.rows[0];
        const qrContent = `NAME:${t.user_name}|EVENT:${t.title}|DATE:${t.date}|LOC:${t.location}|ID:${t.id}`;
        await client.query(`UPDATE tickets SET status = 'approved', qr_code = $1 WHERE id = $2`, [qrContent, payment.ticket_id]);
      } else {
        await client.query("UPDATE tickets SET status = 'rejected' WHERE id = $1", [payment.ticket_id]);
      }
      await client.query('COMMIT');
      res.json(payment);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error verifying payment.' });
  }
});

app.get('/api/admin/metrics', authenticateToken, isAdmin, async (req, res) => {
  try {
    const revenueResult = await pool.query("SELECT SUM(amount) as total FROM payments WHERE status = 'approved'");
    const buyersResult = await pool.query("SELECT COUNT(DISTINCT user_name) as total FROM tickets WHERE status = 'approved'");
    const eventsResult = await pool.query("SELECT COUNT(*) as total FROM events WHERE date >= CURRENT_DATE");
    const pendingResult = await pool.query("SELECT COUNT(*) as total FROM payments WHERE status = 'pending'");
    res.json({
      totalRevenue: parseFloat(revenueResult.rows[0].total || 0),
      totalBuyers: parseInt(buyersResult.rows[0].total || 0),
      activeEvents: parseInt(eventsResult.rows[0].total || 0),
      pendingPayments: parseInt(pendingResult.rows[0].total || 0)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching metrics.' });
  }
});

app.get('/api/payments/:ticket_id/status', async (req, res) => {
  try {
    const result = await pool.query('SELECT status FROM payments WHERE ticket_id = $1', [req.params.ticket_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Payment not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching payment status.' });
  }
});

// Admin Organizers management
app.get('/api/admin/organizers', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, role FROM users WHERE role = 'organizer' ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching organizers.' });
  }
});

app.post('/api/admin/organizers', authenticateToken, isAdmin, async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'organizer') RETURNING id, name, email, role",
      [name, email, passwordHash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating organizer.' });
  }
});

app.post('/api/admin/verify-ticket', authenticateToken, isStaff, async (req, res) => {
  const { qr_data } = req.body;
  try {
    let ticketId = qr_data;
    if (qr_data.includes('|ID:')) {
      ticketId = qr_data.split('|ID:')[1];
    } else if (qr_data.startsWith('TICKET:')) {
      ticketId = qr_data.split(':')[1];
    }
    const result = await pool.query(`SELECT t.*, e.title as event_title FROM tickets t JOIN events e ON t.event_id = e.id WHERE t.id = $1 OR t.qr_code = $2`, [ticketId, qr_data]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Ticket not found.' });
    const ticket = result.rows[0];
    if (ticket.status !== 'approved') return res.json({ success: false, message: `Ticket status is ${ticket.status}`, ticket });
    await pool.query("UPDATE tickets SET status = 'used' WHERE id = $1", [ticket.id]);
    res.json({ success: true, message: 'Ticket validated.', ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error verifying ticket.' });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching settings.' });
  }
});

app.post('/api/settings', authenticateToken, isAdmin, async (req, res) => {
  const settings = req.body;
  try {
    for (const s of settings) {
      await pool.query('INSERT INTO settings (payment_method, account_details) VALUES ($1, $2) ON CONFLICT (payment_method) DO UPDATE SET account_details = EXCLUDED.account_details', [s.method, s.details]);
    }
    res.json({ message: 'Settings updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating settings.' });
  }
});

// Mock upload route
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  // In a real app, you would upload to S3 or similar
  // Here we just return a placeholder Unsplash URL for simplicity
  res.json({ url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1200' });
});

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });