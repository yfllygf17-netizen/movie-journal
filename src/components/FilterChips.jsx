import { Heart } from 'lucide-react';
import { GENRES } from '@/lib/constants.js';
import { cn } from '@/lib/utils.js';

function Chip({ active, onClick, children, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 border px-3 py-1 text-xs transition-colors',
        active
          ? 'border-accent bg-accent/15 text-accent'
          : 'border-border text-muted-foreground hover:border-muted-foreground'
      )}
    >
      {Icon && <Icon className={cn('h-3 w-3', active && 'fill-current')} />}
      {children}
    </button>
  );
}

export function FilterChips({ favouritesOnly, onToggleFavourites, genreFilters, onToggleGenre }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Chip active={favouritesOnly} onClick={onToggleFavourites} icon={Heart}>
        Favourites
      </Chip>
      {GENRES.map((genre) => (
        <Chip key={genre} active={genreFilters.includes(genre)} onClick={() => onToggleGenre(genre)}>
          {genre}
        </Chip>
      ))}
    </div>
  );
}
