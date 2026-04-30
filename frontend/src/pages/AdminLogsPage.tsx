import { useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { PageHero } from '@/components/PageHero';
import { ScrollText, ShieldCheck, AlertTriangle, Download, Lock } from 'lucide-react';
import { RoleBadge } from '@/components/RoleBadge';
import { SearchInput, FilterSelect, FilterPanel } from '@/components/FilterComponents';
import { Button } from '@/components/ui/button';
import { usePlatformData } from '@/contexts/PlatformDataContext';
import { toast } from '@/hooks/use-toast';

const csvEscape = (value: string) => {
  if (value == null) return '';
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const RETENTION_MONTHS = 24;

const AdminLogsPage = () => {
  const { activityLogs } = usePlatformData();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ actionType: 'all', role: 'all' });

  const actionTypes = useMemo(
    () => [...new Set(activityLogs.map((log) => log.actionType))],
    [activityLogs],
  );

  const filtered = useMemo(
    () =>
      activityLogs.filter((log) => {
        if (
          search &&
          !log.userName.toLowerCase().includes(search.toLowerCase()) &&
          !log.targetEntity.toLowerCase().includes(search.toLowerCase())
        ) {
          return false;
        }
        if (filters.actionType !== 'all' && log.actionType !== filters.actionType) return false;
        if (filters.role !== 'all' && log.role !== filters.role) return false;
        return true;
      }),
    [activityLogs, filters.actionType, filters.role, search],
  );

  // FR-57 mock anomaly detection: bursts of failures or > 5 events from same user in <60s
  const anomalies = useMemo(() => {
    const failures = activityLogs.filter((log) => log.resultStatus === 'failure');
    const burstWarnings: string[] = [];
    const grouped = new Map<string, number[]>();
    for (const log of activityLogs) {
      const key = log.userName;
      const time = new Date(log.timestamp).getTime();
      const bucket = grouped.get(key) ?? [];
      bucket.push(time);
      grouped.set(key, bucket);
    }
    for (const [name, times] of grouped) {
      const sorted = [...times].sort((a, b) => a - b);
      for (let index = 0; index < sorted.length - 4; index += 1) {
        if (sorted[index + 4] - sorted[index] <= 60_000) {
          burstWarnings.push(name);
          break;
        }
      }
    }
    return { failureCount: failures.length, burstUsers: [...new Set(burstWarnings)] };
  }, [activityLogs]);

  const handleExportCsv = () => {
    const header = [
      'timestamp',
      'user_name',
      'role',
      'action_type',
      'target_entity',
      'result_status',
      'ip_preview',
      'hash',
      'prev_hash',
    ];
    const rows = filtered.map((log) =>
      [
        log.timestamp,
        log.userName,
        log.role,
        log.actionType,
        log.targetEntity,
        log.resultStatus,
        log.ipPreview,
        log.hash ?? '',
        log.prevHash ?? '',
      ]
        .map(csvEscape)
        .join(','),
    );
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `health-ai-activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'CSV exported',
      description: `Downloaded ${filtered.length} log entries.`,
    });
  };

  return (
    <AppShell>
      <PageHero
        eyebrow="Admin"
        title="Activity Logs"
        description="Append-only audit trail of platform activity. No patient data is recorded."
        icon={ScrollText}
        meta={
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
              <span className="tabular-nums">{filtered.length}</span> of {activityLogs.length} entries
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success ring-1 ring-success/20">
              <ShieldCheck className="h-3 w-3" />
              Hash-chained
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
              <Lock className="h-3 w-3" />
              {RETENTION_MONTHS}-month retention
            </span>
          </div>
        }
        action={
          <Button variant="outline" size="sm" className="rounded-full" onClick={handleExportCsv}>
            <Download className="mr-1 h-4 w-4" /> Export CSV
          </Button>
        }
      />

      {(anomalies.failureCount > 0 || anomalies.burstUsers.length > 0) && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-300/40 bg-amber-50/70 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
          <div className="text-sm">
            <p className="font-semibold text-amber-700 dark:text-amber-300">
              Anomaly detection (heuristic)
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-amber-700/90 dark:text-amber-200/90">
              {anomalies.failureCount > 0 && (
                <li>
                  {anomalies.failureCount} failed action
                  {anomalies.failureCount === 1 ? '' : 's'} in current log window.
                </li>
              )}
              {anomalies.burstUsers.length > 0 && (
                <li>Burst activity (≥5 events in &lt;60s) from: {anomalies.burstUsers.join(', ')}</li>
              )}
            </ul>
          </div>
        </div>
      )}

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search logs..." />
      </div>
      <FilterPanel filters={filters} onClear={() => setFilters({ actionType: 'all', role: 'all' })}>
        <FilterSelect
          label="Action Type"
          value={filters.actionType}
          onChange={(value) => setFilters((current) => ({ ...current, actionType: value }))}
          options={actionTypes}
        />
        <FilterSelect
          label="Role"
          value={filters.role}
          onChange={(value) => setFilters((current) => ({ ...current, role: value }))}
          options={['engineer', 'healthcare', 'admin']}
        />
      </FilterPanel>

      <div className="hidden md:block rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Timestamp</th>
              <th className="text-left p-3 font-medium text-muted-foreground">User</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Target</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Result</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Hash</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="p-3 text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="p-3 font-medium">{log.userName}</td>
                <td className="p-3">
                  <RoleBadge role={log.role} showIcon={false} />
                </td>
                <td className="p-3 text-muted-foreground">{log.actionType}</td>
                <td className="p-3 text-muted-foreground max-w-[200px] truncate">{log.targetEntity}</td>
                <td className="p-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      log.resultStatus === 'success'
                        ? 'bg-success/10 text-success'
                        : log.resultStatus === 'failure'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-warning/10 text-warning'
                    }`}
                  >
                    {log.resultStatus}
                  </span>
                </td>
                <td className="p-3 font-mono text-[10px] text-muted-foreground">{log.hash ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {filtered.map((log) => (
          <div key={log.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium">{log.userName}</p>
              <RoleBadge role={log.role} showIcon={false} />
            </div>
            <p className="text-xs text-muted-foreground">{log.actionType}</p>
            <p className="text-xs text-muted-foreground truncate">{log.targetEntity}</p>
            <p className="text-xs text-muted-foreground mt-1">{new Date(log.timestamp).toLocaleString()}</p>
            {log.hash && (
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">hash: {log.hash}</p>
            )}
          </div>
        ))}
      </div>

      <p className="mt-6 rounded-2xl border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
        <strong className="text-foreground">Tamper resistance:</strong> each entry stores a SHA-style
        digest chained to the previous entry's hash. Retention: {RETENTION_MONTHS} months. Logs are
        append-only; deletion requires a separate compliance request.
      </p>
    </AppShell>
  );
};

export default AdminLogsPage;
