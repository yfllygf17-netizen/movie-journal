import { useEffect, useRef, useState } from 'react';
import { Film } from 'lucide-react';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Button } from '@/components/ui/button.jsx';
import { StarRating } from '@/components/StarRating.jsx';
import { GenrePicker } from '@/components/GenrePicker.jsx';
import { searchTmdb } from '@/lib/api.js';
import { useDebouncedValue } from '@/hooks/useDebouncedValue.js';
import { today } from '@/lib/utils.js';

const EMPTY_FORM = { title: '', posterUrl: '', genres: [], rating: 0, watchedAt: '', notes: '' };

export function AddMovieForm({ onAdd }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const containerRef = useRef(null);
  const debouncedTitle = useDebouncedValue(form.title, 300);

  useEffect(() => {
    if (debouncedTitle.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    searchTmdb(debouncedTitle)
      .then((results) => {
        if (!cancelled) setSuggestions(results);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedTitle]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectSuggestion(s) {
    setForm((f) => ({ ...f, title: s.title, posterUrl: s.poster_url || '', genres: s.genres || [] }));
    setSuggestions([]);
    setShowSuggestions(false);
  }

  async function handleSubmit(watched) {
    if (!form.title.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAdd({
        title: form.title.trim(),
        poster_url: form.posterUrl || null,
        genres: form.genres,
        rating: form.rating || null,
        watched,
        watched_at: watched ? form.watchedAt || today() : null,
        notes: form.notes.trim() || null,
      });
      setForm(EMPTY_FORM);
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = !form.title.trim() || submitting;

  return (
    <div className="space-y-5">
      <div ref={containerRef} className="relative">
        <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Title</label>
        <Input
          value={form.title}
          onChange={(e) => {
            setForm((f) => ({ ...f, title: e.target.value, posterUrl: '' }));
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Search a movie title…"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto border border-border bg-card shadow-2xl scrollbar-thin">
            {suggestions.map((s, i) => (
              <button
                key={`${s.title}-${i}`}
                type="button"
                onClick={() => selectSuggestion(s)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted"
              >
                {s.poster_url ? (
                  <img src={s.poster_url} alt="" className="h-12 w-8 flex-none object-cover" />
                ) : (
                  <div className="flex h-12 w-8 flex-none items-center justify-center bg-muted text-muted-foreground">
                    <Film className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm text-foreground">{s.title}</div>
                  {s.year && <div className="text-xs text-muted-foreground">{s.year}</div>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
          Genres <span className="normal-case">(up to 3)</span>
        </label>
        <GenrePicker selected={form.genres} onChange={(genres) => setForm((f) => ({ ...f, genres }))} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Rating</label>
        <StarRating value={form.rating} onChange={(rating) => setForm((f) => ({ ...f, rating }))} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Date Watched</label>
        <Input type="date" value={form.watchedAt} onChange={(e) => setForm((f) => ({ ...f, watchedAt: e.target.value }))} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Notes</label>
        <Textarea
          rows={3}
          placeholder="Optional thoughts…"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="flex-1" disabled={disabled} onClick={() => handleSubmit(true)}>
          Add to Watched
        </Button>
        <Button className="flex-1" variant="outline" disabled={disabled} onClick={() => handleSubmit(false)}>
          Add to Watchlist
        </Button>
      </div>
    </div>
  );
}
