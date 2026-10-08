import { GENRES, MAX_GENRES } from '@/lib/constants.js';
import { cn } from '@/lib/utils.js';

export function GenrePicker({ selected, onChange, max = MAX_GENRES }) {
  function toggle(genre) {
    if (selected.includes(genre)) {
      onChange(selected.filter((g) => g !== genre));
    } else if (selected.length < max) {
      onChange([...selected, genre]);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {GENRES.map((genre) => {
        const active = selected.includes(genre);
        const disabled = !active && selected.length >= max;
        return (
          <button
            key={genre}
            type="button"
            disabled={disabled}
            onClick={() => toggle(genre)}
            className={cn(
              'border px-2.5 py-1 text-xs transition-colors',
              active
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-border text-muted-foreground hover:border-muted-foreground',
              disabled && 'cursor-not-allowed opacity-40'
            )}
          >
            {genre}
          </button>
        );
      })}
    </div>
  );
}
