import { useMemo } from 'react';
import { AppShell } from '@/components/AppShell';
import { StatsCard } from '@/components/SharedComponents';
import { PageHero } from '@/components/PageHero';
import { usePlatformData } from '@/contexts/PlatformDataContext';
import { Users, FileText, Calendar, TrendingUp, MapPin, Cpu, BarChart3 } from 'lucide-react';

const AdminStatsPage = () => {
  const { posts, users, meetingRequests } = usePlatformData();

  const cities = useMemo(
    () =>
      posts.reduce(
        (acc, post) => {
          acc[post.city] = (acc[post.city] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    [posts],
  );

  const domains = useMemo(
    () =>
      posts.reduce(
        (acc, post) => {
          acc[post.workingDomain] = (acc[post.workingDomain] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    [posts],
  );

  const matchRate = useMemo(() => {
    if (posts.length === 0) return '0%';
    const matched = posts.filter((post) => post.status === 'Partner Found').length;
    return `${Math.round((matched / posts.length) * 100)}%`;
  }, [posts]);

  return (
    <AppShell>
      <PageHero
        eyebrow="Admin"
        title="Platform Statistics"
        description="Overview of platform metrics and usage."
        icon={BarChart3}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Total Users" value={users.length} icon={Users} />
        <StatsCard label="Total Posts" value={posts.length} icon={FileText} />
        <StatsCard label="Meeting Requests" value={meetingRequests.length} icon={Calendar} />
        <StatsCard label="Match Rate" value={matchRate} icon={TrendingUp} trend="Partner Found / Total" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Posts by City
          </h3>
          {Object.entries(cities)
            .sort((a, b) => b[1] - a[1])
            .map(([city, count]) => (
              <div
                key={city}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <span className="text-sm text-muted-foreground">{city || '—'}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(count / Math.max(posts.length, 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              </div>
            ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Cpu className="h-4 w-4" /> Posts by Domain
          </h3>
          {Object.entries(domains)
            .sort((a, b) => b[1] - a[1])
            .map(([domain, count]) => (
              <div
                key={domain}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <span className="text-sm text-muted-foreground">{domain}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(count / Math.max(posts.length, 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </AppShell>
  );
};

export default AdminStatsPage;
