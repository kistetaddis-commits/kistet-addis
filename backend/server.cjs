require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = process.env.PORT || 5000;

// ================= UPLOAD FOLDER =================
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

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
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

// ================= FILE UPLOAD =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

// ================= AUTH =================
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// ================= LOGIN =================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1 OR name=$1",
      [email]
    );

    if (!result.rows.length)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= EVENTS =================
app.get("/api/events", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM events ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/events/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM events WHERE id=$1",
      [req.params.id]
    );

    if (!result.rows.length)
      return res.status(404).json({ message: "Not found" });

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= CREATE EVENT =================
app.post("/api/events", authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      location,
      latitude,
      longitude,
      price,
      total_tickets,
      selling_deadline,
      event_type,
      image_url,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO events (
        id, title, description, event_date,
        location, latitude, longitude,
        ticket_price, total_tickets, sold_tickets,
        selling_deadline, event_type,
        image_url, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,$10,$11,$12,$13)
      RETURNING *`,
      [
        uuidv4(),
        title,
        description,
        date,
        location,
        latitude,
        longitude,
        price,
        total_tickets,
        selling_deadline,
        event_type,
        image_url,
        req.user.id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= PAYMENT ACCOUNTS =================

// 🔥 THIS FIXES YOUR ERROR
app.get("/api/payments/accounts", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM payment_accounts ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/payments/accounts", authenticateToken, async (req, res) => {
  try {
    const { method_name, account_number, account_name, description } =
      req.body;

    const result = await pool.query(
      `INSERT INTO payment_accounts 
      (id, method_name, account_number, account_name, description, is_active)
      VALUES ($1,$2,$3,$4,$5,true)
      RETURNING *`,
      [uuidv4(), method_name, account_number, account_name, description]
    );

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= PAYMENTS =================
app.get("/api/payments/pending", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM payments WHERE status='pending'"
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= TICKETS =================
app.get("/api/tickets/pending", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tickets WHERE status='pending'"
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/tickets/approved", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tickets WHERE status='approved'"
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// 🔥 APPROVE / REJECT (VERY IMPORTANT)
app.put("/api/tickets/:id/approve", authenticateToken, async (req, res) => {
  try {
    await pool.query(
      "UPDATE tickets SET status='approved' WHERE id=$1",
      [req.params.id]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/tickets/:id/reject", authenticateToken, async (req, res) => {
  try {
    await pool.query(
      "UPDATE tickets SET status='rejected' WHERE id=$1",
      [req.params.id]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= PURCHASE =================
app.post("/api/tickets/purchase", async (req, res) => {
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
        id, event_id, user_name, phone,
        email, quantity, method,
        transaction_id, amount, status
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

    res.json({ success: true });
  } catch {
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
      return res.status(400).json({ message: "No file" });
    }

    const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
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