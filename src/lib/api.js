const BASE = '/api';

async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function fetchMovies(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE}/movies${qs ? `?${qs}` : ''}`).then(handleResponse);
}

export function createMovie(data) {
  return fetch(`${BASE}/movies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse);
}

export function updateMovie(id, data) {
  return fetch(`${BASE}/movies/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse);
}

export function deleteMovie(id) {
  return fetch(`${BASE}/movies/${id}`, { method: 'DELETE' }).then(handleResponse);
}

export function searchTmdb(query) {
  return fetch(`${BASE}/tmdb/search?q=${encodeURIComponent(query)}`).then(handleResponse);
}

export function importMovies(data) {
  return fetch(`${BASE}/movies/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse);
}

export const EXPORT_URL = `${BASE}/movies/export`;
