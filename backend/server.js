// override: true ensures backend/.env always wins for PORT/TMDB_KEY, even if an
// ambient PORT env var (e.g. injected by tooling around the frontend dev server)
// is already set in the shared process environment.
require('dotenv').config({ path: require('path').join(__dirname, '.env'), override: true });

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./db');
const {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  requireAuth,
  COOKIE_NAME,
  COOKIE_OPTIONS,
  CLEAR_COOKIE_OPTIONS,
} = require('./auth');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const TMDB_KEY = process.env.TMDB_KEY;

// Maps TMDB's movie genre IDs to this app's fixed genre list. TMDB genres with
// no equivalent here (Adventure, Crime, Family, History, Music, Mystery, TV
// Movie, War, Western) are intentionally left unmapped and get filtered out.
const TMDB_GENRE_MAP = {
  28: 'Action',
  35: 'Comedy',
  18: 'Drama',
  27: 'Horror',
  10749: 'Romance',
  878: 'Sci-Fi',
  53: 'Thriller',
  16: 'Animation',
  99: 'Documentary',
  14: 'Fantasy',
};

const SORT_COLUMNS = {
  date: 'created_at',
  rating: 'rating',
  title: 'title',
};

const PATCHABLE_FIELDS = [
  'title',
  'rating',
  'notes',
  'watched',
  'genres',
  'poster_url',
  'watched_at',
  'favourite',
  'rewatches',
  'priority',
];

const BOOLEAN_FIELDS = ['watched', 'favourite', 'priority'];
const JSON_FIELDS = ['genres', 'rewatches'];

function serializeMovie(row) {
  if (!row) return row;
  return {
    ...row,
    genres: JSON.parse(row.genres || '[]'),
    rewatches: JSON.parse(row.rewatches || '[]'),
    watched: !!row.watched,
    favourite: !!row.favourite,
    priority: !!row.priority,
  };
}

function getMovieById(id, userId) {
  return db.prepare('SELECT * FROM movies WHERE id = ? AND user_id = ?').get(id, userId);
}

// ---------------------------------------------------------------------------
// Auth routes — these stay public; everything registered after requireAuth()
// below requires a valid session.
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }
  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: 'Password must be 8-72 characters' });
  }
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'An account with that email already exists' });
  }

  // The very first account ever created inherits any movies left over from
  // before multi-user accounts existed, rather than leaving them orphaned.
  const register = db.transaction((email, passwordHash) => {
    const isFirstUser = db.prepare('SELECT COUNT(*) AS c FROM users').get().c === 0;
    const { lastInsertRowid: userId } = db
      .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
      .run(email, passwordHash);
    if (isFirstUser) {
      db.prepare('UPDATE movies SET user_id = ? WHERE user_id IS NULL').run(userId);
    }
    return userId;
  });

  const userId = register(email, hashPassword(password));
  res.cookie(COOKIE_NAME, signToken(userId), COOKIE_OPTIONS);
  res.status(201).json({ user: { id: userId, email } });
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');

  const user = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.cookie(COOKIE_NAME, signToken(user.id), COOKIE_OPTIONS);
  res.json({ user: { id: user.id, email: user.email } });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, CLEAR_COOKIE_OPTIONS);
  res.json({ ok: true });
});

// GET /api/auth/me — always 200; the frontend uses this to decide whether to
// show the login screen or the journal, so it's intentionally not gated.
app.get('/api/auth/me', (req, res) => {
  const userId = verifyToken(req.cookies?.[COOKIE_NAME]);
  if (!userId) return res.json({ user: null });

  const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(userId);
  res.json({ user: user || null });
});

// Everything below this line requires a valid session.
app.use(requireAuth);

// GET /api/movies?sort=date|rating|title&order=asc|desc
app.get('/api/movies', (req, res) => {
  const sortColumn = SORT_COLUMNS[req.query.sort] || SORT_COLUMNS.date;
  const sortOrder = String(req.query.order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const rows = db
    .prepare(`SELECT * FROM movies WHERE user_id = ? ORDER BY ${sortColumn} ${sortOrder}, id DESC`)
    .all(req.userId);

  res.json(rows.map(serializeMovie));
});

// GET /api/movies/export
app.get('/api/movies/export', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM movies WHERE user_id = ? ORDER BY id ASC')
    .all(req.userId)
    .map(serializeMovie);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="movie-journal-export.json"');
  res.send(JSON.stringify(rows, null, 2));
});

// POST /api/movies/import
app.post('/api/movies/import', (req, res) => {
  const movies = req.body;
  if (!Array.isArray(movies)) {
    return res.status(400).json({ error: 'Expected a JSON array of movies' });
  }

  const findByTitle = db.prepare('SELECT id FROM movies WHERE title = ? AND user_id = ?');
  const insert = db.prepare(`
    INSERT INTO movies (title, rating, notes, watched, genres, poster_url, watched_at, favourite, rewatches, priority, user_id)
    VALUES (@title, @rating, @notes, @watched, @genres, @poster_url, @watched_at, @favourite, @rewatches, @priority, @user_id)
  `);

  let imported = 0;
  let skipped = 0;

  const importAll = db.transaction((items, userId) => {
    for (const item of items) {
      const title = (item && item.title ? String(item.title) : '').trim();
      if (!title || findByTitle.get(title, userId)) {
        skipped++;
        continue;
      }
      insert.run({
        title,
        rating: item.rating ?? null,
        notes: item.notes ?? null,
        watched: item.watched ? 1 : 0,
        genres: JSON.stringify(Array.isArray(item.genres) ? item.genres : []),
        poster_url: item.poster_url ?? null,
        watched_at: item.watched_at ?? null,
        favourite: item.favourite ? 1 : 0,
        rewatches: JSON.stringify(Array.isArray(item.rewatches) ? item.rewatches : []),
        priority: item.priority ? 1 : 0,
        user_id: userId,
      });
      imported++;
    }
  });

  importAll(movies, req.userId);
  res.json({ imported, skipped });
});

// GET /api/tmdb/search?q=
app.get('/api/tmdb/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json([]);
  if (!TMDB_KEY) {
    return res.status(500).json({ error: 'TMDB_KEY is not configured on the server' });
  }

  try {
    const url = new URL('https://api.themoviedb.org/3/search/movie');
    url.searchParams.set('api_key', TMDB_KEY);
    url.searchParams.set('query', q);
    url.searchParams.set('include_adult', 'false');

    const tmdbRes = await fetch(url);
    if (!tmdbRes.ok) throw new Error(`TMDB responded with ${tmdbRes.status}`);
    const data = await tmdbRes.json();

    const results = (data.results || [])
      .slice(0, 8)
      .map((movie) => ({
        title: movie.title,
        year: movie.release_date ? movie.release_date.slice(0, 4) : null,
        poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : null,
        genres: (movie.genre_ids || [])
          .map((id) => TMDB_GENRE_MAP[id])
          .filter(Boolean)
          .slice(0, 3),
      }));

    res.json(results);
  } catch (err) {
    console.error('TMDB search failed:', err.message);
    res.status(502).json({ error: 'Failed to fetch from TMDB' });
  }
});

// POST /api/movies
app.post('/api/movies', (req, res) => {
  const { title, rating, notes, watched, genres, poster_url, watched_at } = req.body || {};

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'title is required' });
  }

  const stmt = db.prepare(`
    INSERT INTO movies (title, rating, notes, watched, genres, poster_url, watched_at, user_id)
    VALUES (@title, @rating, @notes, @watched, @genres, @poster_url, @watched_at, @user_id)
  `);

  const info = stmt.run({
    title: String(title).trim(),
    rating: rating ?? null,
    notes: notes ?? null,
    watched: watched ? 1 : 0,
    genres: JSON.stringify(Array.isArray(genres) ? genres : []),
    poster_url: poster_url ?? null,
    watched_at: watched_at ?? null,
    user_id: req.userId,
  });

  res.status(201).json(serializeMovie(getMovieById(info.lastInsertRowid, req.userId)));
});

// PATCH /api/movies/:id
app.patch('/api/movies/:id', (req, res) => {
  const existing = getMovieById(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Movie not found' });

  const body = req.body || {};
  const updates = {};

  for (const field of PATCHABLE_FIELDS) {
    if (!(field in body)) continue;
    let value = body[field];
    if (BOOLEAN_FIELDS.includes(field)) value = value ? 1 : 0;
    if (JSON_FIELDS.includes(field)) value = JSON.stringify(Array.isArray(value) ? value : []);
    updates[field] = value;
  }

  if (Object.keys(updates).length === 0) {
    return res.json(serializeMovie(existing));
  }

  const setClause = Object.keys(updates).map((field) => `${field} = @${field}`).join(', ');
  db.prepare(`UPDATE movies SET ${setClause} WHERE id = @id AND user_id = @user_id`).run({
    ...updates,
    id: req.params.id,
    user_id: req.userId,
  });

  res.json(serializeMovie(getMovieById(req.params.id, req.userId)));
});

// DELETE /api/movies/:id
app.delete('/api/movies/:id', (req, res) => {
  const info = db.prepare('DELETE FROM movies WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (info.changes === 0) return res.status(404).json({ error: 'Movie not found' });
  res.status(204).end();
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Movie Journal API running on http://localhost:${PORT}`);
  if (!TMDB_KEY) {
    console.warn('TMDB_KEY is not set in backend/.env — title autocomplete will be disabled.');
  }
});
