const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Serve static files (optional) — serves the workspace root so you can open pages via http://localhost:3000/html/...
app.use(express.static(path.join(__dirname)));

// Initialize SQLite database
const dbPath = path.join(__dirname, 'data.db');
const db = new Database(dbPath);

// Create tables if they don't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    studentNumber TEXT,
    strand TEXT,
    section TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS consultations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    time TEXT,
    date TEXT,
    chief_complaint TEXT,
    disposition TEXT,
    diagnosis TEXT,
    treatment TEXT,
    nurse TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(patient_id) REFERENCES patients(id)
  )
`).run();

// Patients endpoints
app.get('/api/patients', (req, res) => {
  const q = (req.query.search || '').trim();
  if (!q) {
    const rows = db.prepare('SELECT * FROM patients ORDER BY id DESC LIMIT 100').all();
    return res.json(rows);
  }
  const like = `%${q}%`;
  const rows = db.prepare(`SELECT * FROM patients WHERE name LIKE ? OR studentNumber LIKE ? ORDER BY id DESC LIMIT 50`).all(like, like);
  res.json(rows);
});

app.post('/api/patients', (req, res) => {
  const { name, studentNumber, strand, section } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const stmt = db.prepare('INSERT INTO patients (name, studentNumber, strand, section) VALUES (?, ?, ?, ?)');
  const info = stmt.run(name, studentNumber || '', strand || '', section || '');
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(info.lastInsertRowid);
  res.json(patient);
});

// Consultations endpoints
app.get('/api/consultations', (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, p.name as patientName, p.studentNumber, p.strand, p.section
    FROM consultations c
    JOIN patients p ON p.id = c.patient_id
    ORDER BY c.date DESC, c.time DESC
    LIMIT 500
  `).all();
  res.json(rows);
});

app.post('/api/consultations', (req, res) => {
  const data = req.body || {};

  // Accept either patientId or patient object
  let patientId = data.patientId || null;
  if (!patientId) {
    const p = data.patient;
    if (!p || !p.name) return res.status(400).json({ error: 'patient or patientId required' });
    const insert = db.prepare('INSERT INTO patients (name, studentNumber, strand, section) VALUES (?, ?, ?, ?)');
    const info = insert.run(p.name, p.studentNumber || '', p.strand || '', p.section || '');
    patientId = info.lastInsertRowid;
  }

  const stmt = db.prepare(`INSERT INTO consultations (patient_id, time, date, chief_complaint, disposition, diagnosis, treatment, nurse) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const info = stmt.run(patientId, data.time || '', data.date || '', data.chiefComplaint || '', data.disposition || '', data.diagnosis || '', data.treatment || '', data.nurse || '');

  const consultation = db.prepare('SELECT c.*, p.name as patientName FROM consultations c JOIN patients p ON p.id = c.patient_id WHERE c.id = ?').get(info.lastInsertRowid);

  res.json(consultation);
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
