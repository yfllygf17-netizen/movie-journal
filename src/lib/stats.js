import { GENRES } from '@/lib/constants.js';

function computeMonthly(watched) {
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      count: 0,
    });
  }
  const byKey = Object.fromEntries(months.map((m) => [m.key, m]));

  for (const movie of watched) {
    const dateStr = movie.watched_at || movie.created_at;
    if (!dateStr) continue;
    const key = dateStr.slice(0, 7);
    if (byKey[key]) byKey[key].count++;
  }

  return months.map(({ label, count }) => ({ label, count }));
}

export function computeStats(movies) {
  const watched = movies.filter((m) => m.watched);
  const watchlist = movies.filter((m) => !m.watched);
  const rated = watched.filter((m) => m.rating);
  const avgRating = rated.length ? rated.reduce((sum, m) => sum + m.rating, 0) / rated.length : 0;

  const genreCounts = Object.fromEntries(GENRES.map((g) => [g, 0]));
  for (const movie of watched) {
    for (const genre of movie.genres) {
      if (genreCounts[genre] === undefined) genreCounts[genre] = 0;
      genreCounts[genre]++;
    }
  }

  const ratingData = [1, 2, 3, 4, 5].map((star) => ({
    star: `${star}★`,
    count: watched.filter((m) => m.rating && Math.round(m.rating) === star).length,
  }));

  return {
    totalWatched: watched.length,
    totalWatchlist: watchlist.length,
    avgRating,
    favouriteCount: movies.filter((m) => m.favourite).length,
    priorityCount: movies.filter((m) => m.priority).length,
    totalRewatches: movies.reduce((sum, m) => sum + (m.rewatches?.length || 0), 0),
    genreData: Object.entries(genreCounts).map(([genre, count]) => ({ genre, count })),
    ratingData,
    monthlyData: computeMonthly(watched),
  };
}
