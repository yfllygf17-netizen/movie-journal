import { ArrowDownAZ, ArrowUpAZ } from 'lucide-react';

const OPTIONS = [
  { value: 'date', label: 'Date Added' },
  { value: 'rating', label: 'Rating' },
  { value: 'title', label: 'Title' },
];

export function SortControls({ sortBy, onSortByChange, order, onOrderChange }) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value)}
        className="border border-border bg-background px-2 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        title={order === 'asc' ? 'Ascending' : 'Descending'}
        onClick={() => onOrderChange(order === 'asc' ? 'desc' : 'asc')}
        className="border border-border p-1.5 text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
      >
        {order === 'asc' ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
      </button>
    </div>
  );
}
