import { Link } from 'react-router-dom';
import { Film, Download, BarChart2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button.jsx';
import { ThemeToggle } from '@/components/ThemeToggle.jsx';
import { EXPORT_URL } from '@/lib/api.js';
import { cn } from '@/lib/utils.js';

export function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 text-accent" />
          <h1 className="font-serif text-xl tracking-wide text-foreground">Movie Journal</h1>
        </div>
        <div className="flex items-center gap-2">
          <a href={EXPORT_URL} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            <Download className="h-4 w-4" /> Export
          </a>
          <Link to="/stats" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            <BarChart2 className="h-4 w-4" /> Stats
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
