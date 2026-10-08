import { useEffect, useState } from 'react';
import { ExternalLink, Film, Heart, Bookmark, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { StarRating } from '@/components/StarRating.jsx';
import { GenrePicker } from '@/components/GenrePicker.jsx';
import { cn, formatDate, today } from '@/lib/utils.js';

function toDraft(movie) {
  if (!movie) return null;
  return {
    title: movie.title,
    rating: movie.rating || 0,
    notes: movie.notes || '',
    genres: movie.genres,
    watched: movie.watched,
    watched_at: movie.watched_at || '',
  };
}

function isDirty(draft, movie) {
  if (!draft || !movie) return false;
  return (
    draft.title !== movie.title ||
    draft.rating !== (movie.rating || 0) ||
    draft.notes !== (movie.notes || '') ||
    JSON.stringify(draft.genres) !== JSON.stringify(movie.genres) ||
    draft.watched !== movie.watched ||
    draft.watched_at !== (movie.watched_at || '')
  );
}

export function MovieDetailModal({ movie, open, onClose, onUpdate, onDelete }) {
  const [draft, setDraft] = useState(() => toDraft(movie));
  const [rewatchDate, setRewatchDate] = useState(today());
  const [rewatchNote, setRewatchNote] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(toDraft(movie));
    setRewatchDate(today());
    setRewatchNote('');
    setSaved(false);
  }, [movie?.id]);

  if (!movie || !draft) return null;

  const dirty = isDirty(draft, movie);

  async function handleSave() {
    await onUpdate(movie.id, {
      title: draft.title.trim() || movie.title,
      rating: draft.watched ? draft.rating || null : null,
      notes: draft.watched ? draft.notes.trim() || null : null,
      genres: draft.genres,
      watched: draft.watched,
      watched_at: draft.watched ? draft.watched_at || null : null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function handleLogRewatch() {
    if (!rewatchDate) return;
    const entry = { date: rewatchDate, notes: rewatchNote.trim() };
    await onUpdate(movie.id, { rewatches: [...movie.rewatches, entry] });
    setRewatchNote('');
  }

  async function handleDelete() {
    const deleted = await onDelete(movie);
    if (deleted) onClose();
  }

  const justWatchUrl = `https://www.justwatch.com/us/search?q=${encodeURIComponent(movie.title)}`;
  const sortedRewatches = [...movie.rewatches].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogTitle className="sr-only">Edit {movie.title}</DialogTitle>
        <DialogDescription className="sr-only">View and edit details for {movie.title}</DialogDescription>

        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
          <div className="bg-muted">
            {movie.poster_url ? (
              <img src={movie.poster_url} alt={movie.title} className="h-56 w-full object-cover sm:h-full" />
            ) : (
              <div className="flex h-56 w-full items-center justify-center text-muted-foreground/50 sm:h-full">
                <Film className="h-12 w-12" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 p-6">
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="border-b border-transparent bg-transparent pr-8 font-serif text-3xl text-foreground focus:border-border focus:outline-none"
            />

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={draft.watched}
                  onChange={(e) => setDraft((d) => ({ ...d, watched: e.target.checked }))}
                  className="accent-[var(--accent)]"
                />
                Watched
              </label>
              {draft.watched && (
                <input
                  type="date"
                  value={draft.watched_at}
                  onChange={(e) => setDraft((d) => ({ ...d, watched_at: e.target.value }))}
                  className="border border-border bg-background px-2 py-1 text-foreground"
                />
              )}
            </div>

            {draft.watched && <StarRating value={draft.rating} onChange={(v) => setDraft((d) => ({ ...d, rating: v }))} />}

            <GenrePicker selected={draft.genres} onChange={(v) => setDraft((d) => ({ ...d, genres: v }))} />

            {draft.watched && (
              <Textarea
                rows={3}
                placeholder="Notes…"
                value={draft.notes}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              />
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={handleSave} disabled={!dirty}>
                {saved ? 'Saved ✓' : 'Save Changes'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdate(movie.id, { favourite: !movie.favourite })}
                className={cn(movie.favourite && 'border-accent text-accent')}
              >
                <Heart className={cn('h-3.5 w-3.5', movie.favourite && 'fill-current')} />
                Favourite
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdate(movie.id, { priority: !movie.priority })}
                className={cn(movie.priority && 'border-accent text-accent')}
              >
                <Bookmark className={cn('h-3.5 w-3.5', movie.priority && 'fill-current')} />
                Priority
              </Button>
              <a
                href={justWatchUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center gap-1.5 border border-border px-3 text-xs text-foreground transition-colors hover:border-muted-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" /> JustWatch
              </a>
              <Button size="sm" variant="destructive" className="ml-auto" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="mb-3 font-serif text-lg text-foreground">
                Rewatch History {movie.rewatches.length > 0 && `(${movie.rewatches.length})`}
              </h4>
              <div className="mb-3 flex flex-wrap gap-2">
                <input
                  type="date"
                  value={rewatchDate}
                  onChange={(e) => setRewatchDate(e.target.value)}
                  className="border border-border bg-background px-2 py-1 text-sm text-foreground"
                />
                <input
                  type="text"
                  value={rewatchNote}
                  onChange={(e) => setRewatchNote(e.target.value)}
                  placeholder="Optional note"
                  className="min-w-[140px] flex-1 border border-border bg-background px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground"
                />
                <Button size="sm" variant="outline" onClick={handleLogRewatch}>
                  Log Rewatch
                </Button>
              </div>

              {sortedRewatches.length === 0 ? (
                <p className="text-xs text-muted-foreground">No rewatches logged yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {sortedRewatches.map((r, i) => (
                    <li key={i} className="flex justify-between gap-3 border-b border-border/60 pb-1.5 text-sm">
                      <span className="flex-none text-muted-foreground">{formatDate(r.date)}</span>
                      {r.notes && <span className="truncate text-right text-foreground/80">{r.notes}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
