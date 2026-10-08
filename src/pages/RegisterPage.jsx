import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Film } from 'lucide-react';
import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';

export default function RegisterPage() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await register(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 text-foreground">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.07]"
        style={{ backgroundImage: 'url(/images/paris-street.jpg)' }}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-sm border border-border bg-card p-8">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Film className="h-5 w-5 text-accent" />
          <h1 className="font-serif text-3xl tracking-wide text-foreground">Movie Journal</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Email</label>
            <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Password</label>
            <Input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">At least 8 characters.</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
