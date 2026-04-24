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
  connectionString: "postgresql://kistet_addis_user:zoH32dGQxzHYnTOfRU6Oe5lo3Pt3SJUB@dpg-d7clhcn7f7vs739ic3h0-a.frankfurt-postgres.render.com/kistet_addis",
  ssl: {
    rejectUnauthorized: false
  }
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
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

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

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);

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
    console.error("LOGIN ERROR:", err.message);
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
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/events/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM events WHERE id=$1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
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
        ticket_price, total_tickets,
        sold_tickets,
        selling_deadline, event_type,
        image_url, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
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
        0,
        selling_deadline,
        event_type,
        image_url,
        req.user.id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      message: "Failed to create event",
      error: err.message,
    });
  }
});
pool.query("SELECT current_database(), current_user")
  .then(res => console.log("DB INFO:", res.rows[0]))
  .catch(err => console.log(err));
  console.log("DB URL:", process.env.DATABASE_URL);
// ================= CREATE ORGANIZER (FULL) =================
app.post("/api/organizers", authenticateToken, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check existing
    const exists = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (id, name, email, password, role, phone)
       VALUES ($1, $2, $3, $4, 'organizer', $5)
       RETURNING id, name, email, role`,
      [uuidv4(), name, email, hashedPassword, phone]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("CREATE ORGANIZER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// ================= ADMIN METRICS =================
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
    res.status(500).json({ message: "Server error" });
  }
});

// ================= PAYMENTS =================
app.get("/api/payments/pending", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM payments WHERE status='pending' ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= TICKETS =================

// 🔥 FIXED: pending tickets route (THIS WAS YOUR ERROR)
app.get("/api/tickets/pending", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tickets WHERE status='pending' ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 🔥 optional but useful
app.get("/api/tickets/approved", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tickets WHERE status='approved' ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// ================= PURCHASE TICKET =================
app.post("/api/tickets/purchase", authenticateToken, async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { event_id, user_name, phone, email, quantity, method, transaction_id } = req.body;

    if (!event_id || !user_name || !phone) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const eventResult = await pool.query(
      "SELECT ticket_price FROM events WHERE id = $1",
      [event_id]
    );

    if (!eventResult.rows.length) {
      return res.status(404).json({ message: "Event not found" });
    }

    const price = Number(eventResult.rows[0].ticket_price);
    const qty = Number(quantity || 1);

    const amount = price * qty;

    console.log("AMOUNT:", amount);

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
        email || null,
        qty,
        method || "cash",
        transaction_id || null,
        amount,
      ]
    );

    return res.json({ success: true, amount });

  } catch (err) {
    console.error("PURCHASE ERROR:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
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
    res.status(500).json({ message: "Server error" });
  }
});
app.post("/api/payments/accounts", async (req, res) => {
  try {
    const { method_name, account_number, account_name, description } = req.body;

    const result = await pool.query(
      `INSERT INTO payment_accounts (
        id, method_name, account_number, account_name, description
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        uuidv4(),
        method_name,
        account_number,
        account_name,
        description
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});
app.put("/api/users/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;

    const userResult = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    let updatedPassword = user.password;

    if (newPassword) {
      const valid = await bcrypt.compare(currentPassword, user.password);

      if (!valid) {
        return res.status(400).json({ message: "Current password incorrect" });
      }

      updatedPassword = await bcrypt.hash(newPassword, 10);
    }

    const result = await pool.query(
      `UPDATE users
       SET name=$1, email=$2, password=$3
       WHERE id=$4
       RETURNING id, name, email, role`,
      [name, email, updatedPassword, req.user.id]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});



// ================= PAYMENT ACCOUNTS =================
app.get("/api/payments/accounts", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM payment_accounts");
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
console.log("CONNECTED DB:", process.env.DATABASE_URL);