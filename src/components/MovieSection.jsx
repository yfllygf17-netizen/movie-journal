import { useEffect, useMemo, useState } from 'react';
import { MovieCard } from '@/components/MovieCard.jsx';
import { SortControls } from '@/components/SortControls.jsx';
import { Pagination } from '@/components/Pagination.jsx';
import { sortMovies } from '@/lib/movieFilters.js';
import { PAGE_SIZE } from '@/lib/constants.js';

export function MovieSection({ title, movies, filterKey, emptyMessage, onOpen, ...cardHandlers }) {
  const [sortBy, setSortBy] = useState('date');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [sortBy, order, filterKey]);

  const sorted = useMemo(() => sortMovies(movies, sortBy, order), [movies, sortBy, order]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const pageItems = sorted.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-lg text-foreground">
          {title} <span className="text-sm text-muted-foreground">({sorted.length})</span>
        </h2>
        <SortControls sortBy={sortBy} onSortByChange={setSortBy} order={order} onOrderChange={setOrder} />
      </div>

      {pageItems.length === 0 ? (
        <p className="border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {pageItems.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onOpen={onOpen} {...cardHandlers} />
          ))}
        </div>
      )}

      <Pagination page={clampedPage} totalPages={totalPages} onPageChange={setPage} />
    </section>
  );
}
