import { Link, useNavigate } from 'react-router-dom';
import { Film, Download, BarChart2, LogOut } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button.jsx';
import { ThemeToggle } from '@/components/ThemeToggle.jsx';
import { EXPORT_URL } from '@/lib/api.js';
import { cn } from '@/lib/utils.js';
import { useAuth } from '@/contexts/AuthContext.jsx';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    if (!window.confirm('Log out of Movie Journal?')) return;
    await logout();
    navigate('/login');
  }

  return (
    <header className="relative overflow-hidden border-b border-border">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: 'url(/images/film-strip.png)' }}
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 text-accent" />
          <h1 className="font-serif text-3xl tracking-wide text-foreground">Movie Journal</h1>
        </div>
        <div className="flex items-center gap-2">
          <a href={EXPORT_URL} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            <Download className="h-4 w-4" /> Export
          </a>
          <Link to="/stats" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            <BarChart2 className="h-4 w-4" /> Stats
          </Link>
          {user && (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" /> Log Out
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
