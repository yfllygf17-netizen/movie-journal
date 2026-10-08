import { useMemo, useState } from 'react';
import { Header } from '@/components/Header.jsx';
import { AddMovieForm } from '@/components/AddMovieForm.jsx';
import { SearchBar } from '@/components/SearchBar.jsx';
import { FilterChips } from '@/components/FilterChips.jsx';
import { MovieSection } from '@/components/MovieSection.jsx';
import { MovieDetailModal } from '@/components/MovieDetailModal.jsx';
import { useMovies } from '@/hooks/useMovies.js';
import { applyFilters } from '@/lib/movieFilters.js';
import { today } from '@/lib/utils.js';

export default function MainPage() {
  const { movies, loading, error, addMovie, patchMovie, removeMovie } = useMovies();
  const [search, setSearch] = useState('');
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [genreFilters, setGenreFilters] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const filtered = useMemo(
    () => applyFilters(movies, { search, favouritesOnly, genreFilters }),
    [movies, search, favouritesOnly, genreFilters]
  );
  const watched = useMemo(() => filtered.filter((m) => m.watched), [filtered]);
  const watchlist = useMemo(() => filtered.filter((m) => !m.watched), [filtered]);
  const filterKey = `${search}|${favouritesOnly}|${genreFilters.join(',')}`;
  const selectedMovie = movies.find((m) => m.id === selectedId) || null;

  function toggleGenreFilter(genre) {
    setGenreFilters((prev) => (prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]));
  }

  async function handleToggleFavourite(movie) {
    await patchMovie(movie.id, { favourite: !movie.favourite });
  }

  async function handleTogglePriority(movie) {
    await patchMovie(movie.id, { priority: !movie.priority });
  }

  async function handleQuickRewatch(movie) {
    await patchMovie(movie.id, { rewatches: [...movie.rewatches, { date: today(), notes: '' }] });
  }

  async function handleDelete(movie) {
    if (!window.confirm(`Delete "${movie.title}"? This cannot be undone.`)) return false;
    await removeMovie(movie.id);
    return true;
  }

  const cardHandlers = {
    onToggleFavourite: handleToggleFavourite,
    onTogglePriority: handleTogglePriority,
    onQuickRewatch: handleQuickRewatch,
    onDelete: handleDelete,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6 lg:grid lg:grid-cols-[360px_1fr] lg:items-start lg:gap-8">
        <aside className="mb-8 lg:mb-0">
          <div className="sticky top-6 border border-border bg-card p-5">
            <h2 className="mb-4 font-serif text-lg text-foreground">Add a Movie</h2>
            <AddMovieForm onAdd={addMovie} />
          </div>
        </aside>

        <section className="space-y-8">
          <div className="space-y-3">
            <SearchBar value={search} onChange={setSearch} />
            <FilterChips
              favouritesOnly={favouritesOnly}
              onToggleFavourites={() => setFavouritesOnly((v) => !v)}
              genreFilters={genreFilters}
              onToggleGenre={toggleGenreFilter}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading your journal…</p>
          ) : (
            <>
              <MovieSection
                title="Watched"
                movies={watched}
                filterKey={filterKey}
                emptyMessage="No watched movies match your filters yet."
                onOpen={(m) => setSelectedId(m.id)}
                {...cardHandlers}
              />
              <MovieSection
                title="Watchlist"
                movies={watchlist}
                filterKey={filterKey}
                emptyMessage="Your watchlist is empty."
                onOpen={(m) => setSelectedId(m.id)}
                {...cardHandlers}
              />
            </>
          )}
        </section>
      </main>

      <MovieDetailModal
        movie={selectedMovie}
        open={!!selectedMovie}
        onClose={() => setSelectedId(null)}
        onUpdate={patchMovie}
        onDelete={handleDelete}
      />
    </div>
  );
}
