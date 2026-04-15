import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { SectionHeader } from '@/components/SharedComponents';
import { RoleBadge } from '@/components/RoleBadge';
import { SearchInput, FilterSelect, FilterPanel } from '@/components/FilterComponents';
import { Button } from '@/components/ui/button';
import { mockActivityLogs } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';

const AdminLogsPage = () => {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ actionType: 'all', role: 'all' });

  const actionTypes = [...new Set(mockActivityLogs.map(l => l.actionType))];

  const filtered = mockActivityLogs.filter(l => {
    if (search && !l.userName.toLowerCase().includes(search.toLowerCase()) && !l.targetEntity.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.actionType !== 'all' && l.actionType !== filters.actionType) return false;
    if (filters.role !== 'all' && l.role !== filters.role) return false;
    return true;
  });

  return (
    <AppShell>
      <SectionHeader
        title="Activity Logs"
        description="Audit trail of platform activity."
        action={
          <Button variant="outline" size="sm" onClick={() => toast({ title: 'CSV exported', description: 'Activity log has been exported.' })}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        }
      />
      <div className="mb-4"><SearchInput value={search} onChange={setSearch} placeholder="Search logs..." /></div>
      <FilterPanel filters={filters} onClear={() => setFilters({ actionType: 'all', role: 'all' })}>
        <FilterSelect label="Action Type" value={filters.actionType} onChange={v => setFilters(f => ({ ...f, actionType: v }))} options={actionTypes} />
        <FilterSelect label="Role" value={filters.role} onChange={v => setFilters(f => ({ ...f, role: v }))} options={['engineer', 'healthcare', 'admin']} />
      </FilterPanel>

      <div className="hidden md:block rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/50">
            <th className="text-left p-3 font-medium text-muted-foreground">Timestamp</th>
            <th className="text-left p-3 font-medium text-muted-foreground">User</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Target</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Result</th>
          </tr></thead>
          <tbody>
            {filtered.map(log => (
              <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="p-3 text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="p-3 font-medium">{log.userName}</td>
                <td className="p-3"><RoleBadge role={log.role} showIcon={false} /></td>
                <td className="p-3 text-muted-foreground">{log.actionType}</td>
                <td className="p-3 text-muted-foreground max-w-[200px] truncate">{log.targetEntity}</td>
                <td className="p-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    log.resultStatus === 'success' ? 'bg-success/10 text-success' :
                    log.resultStatus === 'failure' ? 'bg-destructive/10 text-destructive' :
                    'bg-warning/10 text-warning'
                  }`}>{log.resultStatus}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {filtered.map(log => (
          <div key={log.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium">{log.userName}</p>
              <RoleBadge role={log.role} showIcon={false} />
            </div>
            <p className="text-xs text-muted-foreground">{log.actionType}</p>
            <p className="text-xs text-muted-foreground truncate">{log.targetEntity}</p>
            <p className="text-xs text-muted-foreground mt-1">{new Date(log.timestamp).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
};

export default AdminLogsPage;
