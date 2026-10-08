// override: true ensures backend/.env always wins for PORT/TMDB_KEY, even if an
// ambient PORT env var (e.g. injected by tooling around the frontend dev server)
// is already set in the shared process environment.
require('dotenv').config({ path: require('path').join(__dirname, '.env'), override: true });

const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const TMDB_KEY = process.env.TMDB_KEY;

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

function getMovieById(id) {
  return db.prepare('SELECT * FROM movies WHERE id = ?').get(id);
}

// GET /api/movies?sort=date|rating|title&order=asc|desc
app.get('/api/movies', (req, res) => {
  const sortColumn = SORT_COLUMNS[req.query.sort] || SORT_COLUMNS.date;
  const sortOrder = String(req.query.order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const rows = db
    .prepare(`SELECT * FROM movies ORDER BY ${sortColumn} ${sortOrder}, id DESC`)
    .all();

  res.json(rows.map(serializeMovie));
});

// GET /api/movies/export
app.get('/api/movies/export', (req, res) => {
  const rows = db.prepare('SELECT * FROM movies ORDER BY id ASC').all().map(serializeMovie);
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

  const findByTitle = db.prepare('SELECT id FROM movies WHERE title = ?');
  const insert = db.prepare(`
    INSERT INTO movies (title, rating, notes, watched, genres, poster_url, watched_at, favourite, rewatches, priority)
    VALUES (@title, @rating, @notes, @watched, @genres, @poster_url, @watched_at, @favourite, @rewatches, @priority)
  `);

  let imported = 0;
  let skipped = 0;

  const importAll = db.transaction((items) => {
    for (const item of items) {
      const title = (item && item.title ? String(item.title) : '').trim();
      if (!title || findByTitle.get(title)) {
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
      });
      imported++;
    }
  });

  importAll(movies);
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
    INSERT INTO movies (title, rating, notes, watched, genres, poster_url, watched_at)
    VALUES (@title, @rating, @notes, @watched, @genres, @poster_url, @watched_at)
  `);

  const info = stmt.run({
    title: String(title).trim(),
    rating: rating ?? null,
    notes: notes ?? null,
    watched: watched ? 1 : 0,
    genres: JSON.stringify(Array.isArray(genres) ? genres : []),
    poster_url: poster_url ?? null,
    watched_at: watched_at ?? null,
  });

  res.status(201).json(serializeMovie(getMovieById(info.lastInsertRowid)));
});

// PATCH /api/movies/:id
app.patch('/api/movies/:id', (req, res) => {
  const existing = getMovieById(req.params.id);
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
  db.prepare(`UPDATE movies SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.params.id });

  res.json(serializeMovie(getMovieById(req.params.id)));
});

// DELETE /api/movies/:id
app.delete('/api/movies/:id', (req, res) => {
  const info = db.prepare('DELETE FROM movies WHERE id = ?').run(req.params.id);
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
