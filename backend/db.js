const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'moviejournal.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    rating REAL,
    notes TEXT,
    watched INTEGER DEFAULT 0,
    genres TEXT DEFAULT '[]',
    poster_url TEXT,
    watched_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    favourite INTEGER DEFAULT 0,
    rewatches TEXT DEFAULT '[]',
    priority INTEGER DEFAULT 0
  );
`);

module.exports = db;
