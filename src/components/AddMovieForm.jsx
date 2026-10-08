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

const EMPTY_FORM = { title: '', posterUrl: '', genres: [], watched: true, rating: 0, watchedAt: '', notes: '' };

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

  async function handleSubmit() {
    if (!form.title.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAdd({
        title: form.title.trim(),
        poster_url: form.posterUrl || null,
        genres: form.genres,
        rating: form.watched ? form.rating || null : null,
        watched: form.watched,
        watched_at: form.watched ? form.watchedAt || today() : null,
        notes: form.watched ? form.notes.trim() || null : null,
      });
      setForm(EMPTY_FORM);
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = !form.title.trim() || submitting;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-2xl text-foreground">Add a Movie</h2>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={form.watched ? 'default' : 'outline'}
            onClick={() => setForm((f) => ({ ...f, watched: true }))}
          >
            Add to Watched
          </Button>
          <Button
            type="button"
            size="sm"
            variant={!form.watched ? 'default' : 'outline'}
            onClick={() => setForm((f) => ({ ...f, watched: false }))}
          >
            Add to Watchlist
          </Button>
        </div>
      </div>

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

      {form.watched && (
        <>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Rating</label>
            <StarRating value={form.rating} onChange={(rating) => setForm((f) => ({ ...f, rating }))} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Date Watched</label>
            <Input
              type="date"
              value={form.watchedAt}
              onChange={(e) => setForm((f) => ({ ...f, watchedAt: e.target.value }))}
            />
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
        </>
      )}

      <Button className="w-full" disabled={disabled} onClick={handleSubmit}>
        Add Movie
      </Button>
    </div>
  );
}
