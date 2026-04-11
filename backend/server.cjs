require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 5000;

// ---------------- VALIDATION ----------------
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing!");
}

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is missing!");
}

// ---------------- DATABASE ----------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.connect()
  .then(() => console.log('✅ PostgreSQL connected'))
  .catch(err => console.error('❌ DB Error:', err.message));

// ---------------- MIDDLEWARE ----------------
app.use(cors({
  origin: '*',
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------------- UPLOAD CONFIG ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({ storage });

// ---------------- AUTH MIDDLEWARE ----------------
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  });
};

// =====================================================
// 🔥 AUTH - LOGIN
// =====================================================
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email=$1 OR name=$1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// =====================================================
// 🔥 EVENTS - GET ALL
// =====================================================
app.get('/api/events', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM events ORDER BY event_date DESC'
    );

    res.json(result.rows);
  } catch (err) {
    console.error("EVENTS ERROR:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// =====================================================
// 🔥 EVENTS - CREATE
// =====================================================
app.post('/api/events', authenticateToken, async (req, res) => {
  const {
    title,
    description,
    event_date,
    location,
    latitude,
    longitude,
    price,
    total_tickets,
    event_type,
    selling_deadline,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO events 
      (title, description, event_date, location, latitude, longitude, price, total_tickets, event_type, selling_deadline, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [
        title,
        description,
        event_date,
        location,
        latitude,
        longitude,
        price,
        total_tickets,
        event_type,
        selling_deadline,
        req.user.id,
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("CREATE EVENT ERROR:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// =====================================================
// 🔥 IMAGE UPLOAD
// =====================================================
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// =====================================================
// 🔥 HEALTH CHECK (IMPORTANT FOR DEBUGGING)
// =====================================================
app.get('/api/health', (req, res) => {
  res.json({ status: "OK" });
});

// ---------------- START SERVER ----------------
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
});
app.get('/api/admin/metrics', authenticateToken, async (req, res) => {
  try {
    const users = await pool.query('SELECT COUNT(*) FROM users');
    const events = await pool.query('SELECT COUNT(*) FROM events');

    res.json({
      users: parseInt(users.rows[0].count),
      events: parseInt(events.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});