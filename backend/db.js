const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'moviejournal.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

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
    priority INTEGER DEFAULT 0,
    user_id INTEGER REFERENCES users(id)
  );
`);

// CREATE TABLE IF NOT EXISTS is a no-op against a database that already has a
// movies table from before multi-user support existed, so the user_id column
// above only takes effect on brand-new databases. Existing ones need an
// explicit migration, guarded so it only runs once.
const movieColumns = db.prepare('PRAGMA table_info(movies)').all();
if (!movieColumns.some((c) => c.name === 'user_id')) {
  db.exec('ALTER TABLE movies ADD COLUMN user_id INTEGER REFERENCES users(id)');
}
db.exec('CREATE INDEX IF NOT EXISTS idx_movies_user_id ON movies(user_id)');

module.exports = db;
