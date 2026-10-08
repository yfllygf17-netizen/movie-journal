import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';

export function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
