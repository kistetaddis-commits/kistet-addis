import express from 'express';
import pkg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 5000;

// Fix __dirname in ES module
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const authorize = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

// ---------------- AUTH ----------------

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email=$1 OR name=$1',
      [email]
    );

    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(user, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------- EVENTS ----------------

app.get('/api/events', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/events', authenticateToken, async (req, res) => {
  const {
    title,
    description,
    date,
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
      (title, description, date, location, latitude, longitude, price, total_tickets, event_type, selling_deadline, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [
        title,
        description,
        date,
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
    res.status(500).json({ message: err.message });
  }
});

// ---------------- IMAGE UPLOAD ----------------

app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url });
});

// ---------------- SERVER ----------------

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});