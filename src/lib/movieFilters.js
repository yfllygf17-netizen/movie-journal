export function applyFilters(movies, { search, favouritesOnly, genreFilters }) {
  const needle = search.trim().toLowerCase();
  return movies.filter((m) => {
    if (needle && !m.title.toLowerCase().includes(needle)) return false;
    if (favouritesOnly && !m.favourite) return false;
    if (genreFilters.length > 0 && !m.genres.some((g) => genreFilters.includes(g))) return false;
    return true;
  });
}

export function sortMovies(movies, sortBy, order) {
  const factor = order === 'asc' ? 1 : -1;
  const sorted = [...movies].sort((a, b) => {
    if (sortBy === 'rating') return ((a.rating || 0) - (b.rating || 0)) * factor;
    if (sortBy === 'title') return a.title.localeCompare(b.title) * factor;
    return (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0) * factor;
  });
  return sorted;
}
