import { AppShell } from '@/components/AppShell';
import { StatsCard } from '@/components/SharedComponents';
import { mockPosts, mockUsers, mockMeetingRequests, mockActivityLogs } from '@/data/mockData';
import { Users, FileText, Calendar, Activity } from 'lucide-react';

const AdminDashboardPage = () => {
  return (
    <AppShell>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold mb-2">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mb-8">Platform overview and management.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard label="Total Users" value={mockUsers.length} icon={Users} trend="+2 this week" />
          <StatsCard label="Total Posts" value={mockPosts.length} icon={FileText} trend="3 active" />
          <StatsCard label="Meeting Requests" value={mockMeetingRequests.length} icon={Calendar} />
          <StatsCard label="Activity Logs" value={mockActivityLogs.length} icon={Activity} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-base font-semibold mb-3">Posts by Status</h3>
            {['Active', 'Draft', 'Meeting Scheduled', 'Partner Found', 'Expired'].map(status => {
              const count = mockPosts.filter(p => p.status === status).length;
              return (
                <div key={status} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{status}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              );
            })}
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-base font-semibold mb-3">Users by Role</h3>
            {['engineer', 'healthcare', 'admin'].map(role => {
              const count = mockUsers.filter(u => u.role === role).length;
              return (
                <div key={role} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground capitalize">{role === 'healthcare' ? 'Healthcare Professional' : role}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default AdminDashboardPage;
