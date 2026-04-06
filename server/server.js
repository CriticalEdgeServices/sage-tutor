// ═══════════════════════════════════════════════════════════════════
//  SAGE — Cloud Memory Server
//  Deploy this on your Hostinger VPS
//
//  SETUP:
//  1. SSH into VPS
//  2. mkdir ~/sage-server && cd ~/sage-server
//  3. Upload this file + package.json
//  4. npm install
//  5. Set your secret: export SAGE_SECRET="pick-something-long"
//  6. node server.js   (or use PM2 — see bottom)
// ═══════════════════════════════════════════════════════════════════

const express    = require("express");
const Database   = require("better-sqlite3");
const cors       = require("cors");
const path       = require("path");

const app    = express();
const PORT   = process.env.PORT || 3001;
const SECRET = process.env.SAGE_SECRET || "change-this-secret";
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "sage.db");

// ─── Middleware ───────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(cors({
  origin: ["https://www.sage-ai-4-ladypie.com", "http://localhost:5173"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "x-sage-secret"],
}));

// ─── Auth middleware ──────────────────────────────────────────────────
function requireSecret(req, res, next) {
  const provided = req.headers["x-sage-secret"];
  if (!provided || provided !== SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ─── Database setup ───────────────────────────────────────────────────
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS memory (
    id          INTEGER PRIMARY KEY,
    user_id     TEXT NOT NULL DEFAULT 'asia',
    data        TEXT NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT NOT NULL DEFAULT 'asia',
    summary     TEXT NOT NULL,
    agent       TEXT,
    subject     TEXT,
    created_at  INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_memory_user  ON memory(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id, created_at DESC);
`);

// ─── Prepared statements ──────────────────────────────────────────────
const stmts = {
  getMemory:    db.prepare("SELECT data FROM memory WHERE user_id = ?"),
  upsertMemory: db.prepare(`
    INSERT INTO memory (user_id, data, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `),
  addSession:   db.prepare("INSERT INTO sessions (user_id, summary, agent, subject, created_at) VALUES (?, ?, ?, ?, ?)"),
  getSessions:  db.prepare("SELECT id, summary, agent, subject, created_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?"),
  countSessions: db.prepare("SELECT COUNT(*) as count FROM sessions WHERE user_id = ?"),
};

// Fix upsert — SQLite needs unique constraint for ON CONFLICT
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_memory_user_unique ON memory(user_id)`);

// ─── Routes ───────────────────────────────────────────────────────────

// Health check (no auth)
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: Date.now() });
});

// GET memory
app.get("/memory/:userId", requireSecret, (req, res) => {
  try {
    const row = stmts.getMemory.get(req.params.userId);
    if (!row) return res.json({ memory: null });
    res.json({ memory: JSON.parse(row.data) });
  } catch (err) {
    console.error("GET /memory error:", err);
    res.status(500).json({ error: "Failed to load memory" });
  }
});

// POST memory (save/update)
app.post("/memory/:userId", requireSecret, (req, res) => {
  try {
    const { memory } = req.body;
    if (!memory || typeof memory !== "object") {
      return res.status(400).json({ error: "Invalid memory data" });
    }
    stmts.upsertMemory.run(req.params.userId, JSON.stringify(memory), Date.now());
    res.json({ ok: true });
  } catch (err) {
    console.error("POST /memory error:", err);
    res.status(500).json({ error: "Failed to save memory" });
  }
});

// POST session summary (called after each chat exchange)
app.post("/sessions/:userId", requireSecret, (req, res) => {
  try {
    const { summary, agent, subject } = req.body;
    if (!summary) return res.status(400).json({ error: "summary required" });
    stmts.addSession.run(req.params.userId, summary, agent || null, subject || null, Date.now());
    res.json({ ok: true });
  } catch (err) {
    console.error("POST /sessions error:", err);
    res.status(500).json({ error: "Failed to save session" });
  }
});

// GET recent sessions (for parent dashboard)
app.get("/sessions/:userId", requireSecret, (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 20, 50);
    const rows   = stmts.getSessions.all(req.params.userId, limit);
    const total  = stmts.countSessions.get(req.params.userId)?.count || 0;
    res.json({ sessions: rows, total });
  } catch (err) {
    console.error("GET /sessions error:", err);
    res.status(500).json({ error: "Failed to load sessions" });
  }
});

// ─── Start ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✦ Sage memory server running on port ${PORT}`);
  console.log(`  DB: ${DB_PATH}`);
  console.log(`  Secret configured: ${SECRET !== "change-this-secret" ? "yes ✓" : "⚠️  PLEASE SET SAGE_SECRET ENV VAR"}`);
});

// ═══════════════════════════════════════════════════════════════════
//  PM2 SETUP (keeps server running after SSH disconnect)
//  ─────────────────────────────────────────────────────────────────
//  npm install -g pm2
//  SAGE_SECRET="your-secret" pm2 start server.js --name sage-memory
//  pm2 save
//  pm2 startup   ← follow the command it gives you
//
//  Check logs:  pm2 logs sage-memory
//  Restart:     pm2 restart sage-memory
//  Status:      pm2 status
// ═══════════════════════════════════════════════════════════════════
