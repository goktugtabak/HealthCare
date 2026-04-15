import { AppShell } from '@/components/AppShell';
import { SectionHeader, StatsCard } from '@/components/SharedComponents';
import { mockPosts, mockUsers, mockMeetingRequests } from '@/data/mockData';
import { Users, FileText, Calendar, TrendingUp, MapPin, Cpu } from 'lucide-react';

const AdminStatsPage = () => {
  const cities = mockPosts.reduce((acc, p) => { acc[p.city] = (acc[p.city] || 0) + 1; return acc; }, {} as Record<string, number>);
  const domains = mockPosts.reduce((acc, p) => { acc[p.workingDomain] = (acc[p.workingDomain] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <AppShell>
      <SectionHeader title="Platform Statistics" description="Overview of platform metrics and usage." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Total Users" value={mockUsers.length} icon={Users} />
        <StatsCard label="Total Posts" value={mockPosts.length} icon={FileText} />
        <StatsCard label="Meeting Requests" value={mockMeetingRequests.length} icon={Calendar} />
        <StatsCard label="Match Rate" value="37.5%" icon={TrendingUp} trend="Partner Found / Total" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2"><MapPin className="h-4 w-4" /> Posts by City</h3>
          {Object.entries(cities).sort((a, b) => b[1] - a[1]).map(([city, count]) => (
            <div key={city} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{city}</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(count / mockPosts.length) * 100}%` }} />
                </div>
                <span className="text-sm font-medium">{count}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2"><Cpu className="h-4 w-4" /> Posts by Domain</h3>
          {Object.entries(domains).sort((a, b) => b[1] - a[1]).map(([domain, count]) => (
            <div key={domain} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{domain}</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(count / mockPosts.length) * 100}%` }} />
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
