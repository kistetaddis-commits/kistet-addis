require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = process.env.PORT || 5000;

// ================= DATABASE =================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

pool
  .connect()
  .then(() => console.log("✅ PostgreSQL connected"))
  .catch((err) => console.error("❌ DB Error:", err.message));

// ================= MIDDLEWARE =================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// STATIC FILES
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= FILE UPLOAD =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({ storage });

// ================= AUTH MIDDLEWARE =================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// ================= AUTH =================
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1 OR name=$1",
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= EVENTS =================
app.get("/api/events", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM events ORDER BY event_date DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/events/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM events WHERE id=$1", [
      req.params.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= ADMIN =================
app.get("/api/admin/metrics", authenticateToken, async (req, res) => {
  try {
    const users = await pool.query("SELECT COUNT(*) FROM users");
    const events = await pool.query("SELECT COUNT(*) FROM events");

    res.json({
      totalRevenue: 0,
      totalBuyers: parseInt(users.rows[0].count),
      activeEvents: parseInt(events.rows[0].count),
      pendingPayments: 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= PAYMENTS =================
// FIXED: now properly returns DB-ready structure
app.get("/api/payments/pending", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM payments WHERE status = 'pending' ORDER BY created_at DESC"
    );

    res.json(result.rows);
  } catch (err) {
    console.error("PAYMENTS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= TICKETS PURCHASE =================
app.post("/api/tickets/purchase", authenticateToken, async (req, res) => {
  try {
    const {
      event_id,
      user_name,
      phone,
      email,
      quantity,
      method,
      transaction_id,
      amount,
    } = req.body;

    await pool.query(
      `INSERT INTO tickets (
        id, event_id, user_name, phone, email, quantity, method, transaction_id, amount, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')`,
      [
        uuidv4(),
        event_id,
        user_name,
        phone,
        email,
        quantity,
        method,
        transaction_id,
        amount,
      ]
    );

    res.json({
      success: true,
      message: "Ticket submitted",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= ORGANIZERS =================
app.get("/api/organizers", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE role='organizer'"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= UPLOAD =================
app.post(
  "/api/upload",
  authenticateToken,
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const url = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;

    res.json({ url });
  }
);

// ================= HEALTH =================
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// ================= START =================
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${port}`);
});