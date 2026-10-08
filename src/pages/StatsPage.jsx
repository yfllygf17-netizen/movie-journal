import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { buttonVariants } from '@/components/ui/button.jsx';
import { useMovies } from '@/hooks/useMovies.js';
import { computeStats } from '@/lib/stats.js';
import { cn } from '@/lib/utils.js';

function StatTile({ label, value }) {
  return (
    <div className="border border-border bg-card p-4 text-center">
      <div className="font-sans text-2xl font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="border border-border bg-card p-5">
      <h3 className="mb-4 font-serif text-xl text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-border bg-card px-3 py-2 text-sm shadow-xl">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{payload[0].value}</p>
    </div>
  );
}

// Note: our CSS custom properties already hold complete color values (e.g.
// `--accent: hsl(30 14% 58%)`), so they're referenced directly via var() here
// rather than re-wrapped in hsl(), which would produce invalid nested CSS.
const axisTick = { fill: 'var(--muted-foreground)', fontSize: 12 };
const gridStroke = 'var(--border)';
const barFill = 'var(--accent)';

function CountBarChart({ data, dataKey, height, angledLabels }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: angledLabels ? 28 : 0 }} barCategoryGap="20%">
        <CartesianGrid stroke={gridStroke} strokeWidth={1} vertical={false} />
        <XAxis
          dataKey={dataKey}
          tick={axisTick}
          axisLine={{ stroke: gridStroke }}
          tickLine={false}
          angle={angledLabels ? -30 : 0}
          textAnchor={angledLabels ? 'end' : 'middle'}
          interval={0}
        />
        <YAxis allowDecimals={false} tick={axisTick} axisLine={{ stroke: gridStroke }} tickLine={false} width={32} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--muted)' }} />
        <Bar dataKey="count" fill={barFill} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function StatsPage() {
  const { movies, loading } = useMovies();
  const stats = useMemo(() => computeStats(movies), [movies]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="font-serif text-3xl">Statistics</h1>
          <Link to="/" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Crunching the numbers…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <StatTile label="Watched" value={stats.totalWatched} />
              <StatTile label="Watchlist" value={stats.totalWatchlist} />
              <StatTile label="Avg rating" value={stats.avgRating.toFixed(1)} />
              <StatTile label="Favourites" value={stats.favouriteCount} />
              <StatTile label="Priority" value={stats.priorityCount} />
              <StatTile label="Rewatches" value={stats.totalRewatches} />
            </div>

            <ChartCard title="Genre Distribution">
              <CountBarChart data={stats.genreData} dataKey="genre" height={320} angledLabels />
            </ChartCard>

            <ChartCard title="Rating Distribution">
              <CountBarChart data={stats.ratingData} dataKey="star" height={260} />
            </ChartCard>

            <ChartCard title="Watched Per Month (Last 12 Months)">
              <CountBarChart data={stats.monthlyData} dataKey="label" height={280} />
            </ChartCard>
          </>
        )}
      </main>
    </div>
  );
}
