import { useCallback, useEffect, useState } from 'react';
import { fetchMovies, createMovie, updateMovie, deleteMovie } from '@/lib/api.js';

export function useMovies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMovies();
      setMovies(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addMovie = useCallback(async (data) => {
    const created = await createMovie(data);
    setMovies((prev) => [created, ...prev]);
    return created;
  }, []);

  const patchMovie = useCallback(async (id, data) => {
    const updated = await updateMovie(id, data);
    setMovies((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  }, []);

  const removeMovie = useCallback(async (id) => {
    await deleteMovie(id);
    setMovies((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return { movies, loading, error, reload: load, addMovie, patchMovie, removeMovie };
}
