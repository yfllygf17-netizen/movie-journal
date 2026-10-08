import { Star } from 'lucide-react';
import { cn } from '@/lib/utils.js';

const SIZES = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function StarRating({ value = 0, onChange, readOnly = false, size = 'md', className }) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          tabIndex={readOnly ? -1 : 0}
          onClick={(e) => {
            e.stopPropagation();
            if (!readOnly) onChange?.(value === star ? 0 : star);
          }}
          className={cn(
            !readOnly && 'cursor-pointer transition-transform hover:scale-110',
            readOnly && 'cursor-default'
          )}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            className={cn(
              SIZES[size],
              star <= value ? 'fill-accent text-accent' : 'fill-transparent text-muted-foreground/50'
            )}
          />
        </button>
      ))}
    </div>
  );
}
