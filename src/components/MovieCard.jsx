import { Film, Heart, Bookmark, RotateCw, Trash2 } from 'lucide-react';
import { StarRating } from '@/components/StarRating.jsx';
import { cn, formatDate } from '@/lib/utils.js';

function CardIconButton({ active, onClick, icon: Icon, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'transition-colors',
        active ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <Icon className={cn('h-4 w-4', active && 'fill-current')} />
    </button>
  );
}

export function MovieCard({ movie, onOpen, onToggleFavourite, onTogglePriority, onQuickRewatch, onDelete }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(movie)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(movie);
        }
      }}
      className={cn(
        'group flex cursor-pointer flex-col border bg-card transition-colors hover:border-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        movie.priority ? 'border-accent/70' : 'border-border'
      )}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
        {movie.poster_url ? (
          <img src={movie.poster_url} alt={movie.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
            <Film className="h-10 w-10" />
          </div>
        )}
        {movie.priority && (
          <div className="absolute left-2 top-2 bg-accent p-1 text-accent-foreground">
            <Bookmark className="h-3.5 w-3.5 fill-current" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 font-serif text-sm leading-snug text-foreground">{movie.title}</h3>
        <StarRating value={movie.rating || 0} readOnly size="sm" />

        {movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {movie.genres.map((g) => (
              <span key={g} className="border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {g}
              </span>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          {movie.watched ? movie.watched_at ? formatDate(movie.watched_at) : 'Watched' : 'Watchlist'}
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <CardIconButton
              active={movie.favourite}
              onClick={() => onToggleFavourite(movie)}
              icon={Heart}
              title="Favourite"
            />
            <CardIconButton
              active={movie.priority}
              onClick={() => onTogglePriority(movie)}
              icon={Bookmark}
              title="Priority"
            />
            <button
              type="button"
              title="Log a rewatch for today"
              onClick={(e) => {
                e.stopPropagation();
                onQuickRewatch(movie);
              }}
              className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCw className="h-4 w-4" />
              {movie.rewatches.length > 0 && <span className="text-[10px]">{movie.rewatches.length}</span>}
            </button>
          </div>
          <button
            type="button"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(movie);
            }}
            className="text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
