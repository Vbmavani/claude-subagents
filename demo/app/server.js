// INTENTIONALLY VULNERABLE DEMO. Never deploy this.
// Every flaw below is deliberate so the security-auditor agent has something to find.
const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const db = new sqlite3.Database('notes.db');

const JWT_SECRET = 'hunter2-demo-secret'; // hardcoded secret (fake)
const DEBUG = true;

app.use(cors());           // allows every origin
app.use(express.json());

const md5 = (s) => crypto.createHash('md5').update(s).digest('hex');

// --- auth ---------------------------------------------------------------

app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  // no validation: empty, huge, or non-string values accepted
  db.run(`INSERT INTO users (name, pw) VALUES ('${username}', '${md5(password)}')`, () => {
    res.json({ ok: true });
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // SQL injection + no rate limiting
  db.get(
    `SELECT * FROM users WHERE name = '${username}' AND pw = '${md5(password)}'`,
    (err, user) => {
      if (!user) return res.status(401).json({ error: err ? err.message : 'bad login' });
      // token never expires
      res.json({ token: jwt.sign({ id: user.id, admin: user.admin }, JWT_SECRET) });
    }
  );
});

// --- notes --------------------------------------------------------------

app.get('/notes/:id', (req, res) => {
  // no auth check: anyone can read any note (IDOR)
  db.get(`SELECT * FROM notes WHERE id = ${req.params.id}`, (err, note) => {
    res.json(note);
  });
});

app.get('/export', (req, res) => {
  // path traversal: ?file=../../etc/passwd
  res.sendFile(path.join(__dirname, 'exports', req.query.file));
});

app.get('/search', (req, res) => {
  // reflected XSS
  res.send(`<h1>Results for ${req.query.q}</h1>`);
});

app.post('/admin/backup', (req, res) => {
  // trusts a client-supplied flag, and builds a shell command from input
  if (req.body.admin === true) {
    exec(`tar czf backups/${req.body.name}.tgz notes.db`, (e, out) => res.send(out));
  } else {
    res.sendStatus(403);
  }
});

app.get('/redirect', (req, res) => res.redirect(req.query.to)); // open redirect

app.use((err, req, res, next) => {
  // leaks stack traces
  res.status(500).send(DEBUG ? err.stack : 'error');
});

app.listen(3000);
