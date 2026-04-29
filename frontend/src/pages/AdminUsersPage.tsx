import { useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { PageHero } from '@/components/PageHero';
import { Users, ShieldCheck, MoreHorizontal, BarChart3 } from 'lucide-react';
import { RoleBadge } from '@/components/RoleBadge';
import { FilterSelect, FilterPanel, SearchInput } from '@/components/FilterComponents';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformData } from '@/contexts/PlatformDataContext';

const AdminUsersPage = () => {
  const { currentUser } = useAuth();
  const {
    users,
    suspendUser,
    reactivateUser,
    deactivateUser,
    verifyUserDomain,
    getUserActivityMetrics,
  } = usePlatformData();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ role: 'all', status: 'all' });
  const [suspendModal, setSuspendModal] = useState<string | null>(null);
  const [deactivateModal, setDeactivateModal] = useState<string | null>(null);
  const [metricsUserId, setMetricsUserId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      users.filter((user) => {
        if (
          search &&
          !user.fullName.toLowerCase().includes(search.toLowerCase()) &&
          !user.email.toLowerCase().includes(search.toLowerCase())
        ) {
          return false;
        }
        if (filters.role !== 'all' && user.role !== filters.role) return false;
        if (filters.status !== 'all' && user.status !== filters.status) return false;
        return true;
      }),
    [filters.role, filters.status, search, users],
  );

  const metricsUser = users.find((user) => user.id === metricsUserId);
  const metrics = metricsUserId ? getUserActivityMetrics(metricsUserId) : null;
  const actorId = currentUser?.id;

  return (
    <AppShell>
      <PageHero
        eyebrow="Admin"
        title="User Management"
        description="View, verify, and manage platform users."
        icon={Users}
        meta={
          <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
            <span className="tabular-nums">{filtered.length}</span> of {users.length}
          </span>
        }
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search users..." />
      </div>

      <FilterPanel filters={filters} onClear={() => setFilters({ role: 'all', status: 'all' })}>
        <FilterSelect
          label="Role"
          value={filters.role}
          onChange={(value) => setFilters((current) => ({ ...current, role: value }))}
          options={['engineer', 'healthcare', 'admin']}
        />
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(value) => setFilters((current) => ({ ...current, status: value }))}
          options={['active', 'suspended', 'deactivated', 'pending_deletion']}
        />
      </FilterPanel>

      <div className="hidden md:block rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Institution</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Completeness</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Verified</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="p-3 font-medium">{user.fullName}</td>
                <td className="p-3 text-muted-foreground">{user.email}</td>
                <td className="p-3">
                  <RoleBadge role={user.role} showIcon={false} />
                </td>
                <td className="p-3 text-muted-foreground">{user.institution || '—'}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${user.profileCompleteness}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{user.profileCompleteness}%</span>
                  </div>
                </td>
                <td className="p-3">
                  <span className="capitalize text-xs">{user.status.replace('_', ' ')}</span>
                </td>
                <td className="p-3">
                  {user.domainVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                      <ShieldCheck className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Unverified</span>
                  )}
                </td>
                <td className="p-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setMetricsUserId(user.id)}>
                        View Activity
                      </DropdownMenuItem>
                      {!user.domainVerified && (
                        <DropdownMenuItem
                          onClick={() => {
                            verifyUserDomain(user.id, actorId);
                            toast({
                              title: 'Domain verified',
                              description: `${user.fullName}'s institution domain marked as verified.`,
                            });
                          }}
                        >
                          Verify Domain
                        </DropdownMenuItem>
                      )}
                      {user.status === 'active' && (
                        <DropdownMenuItem onClick={() => setSuspendModal(user.id)}>
                          Suspend Account
                        </DropdownMenuItem>
                      )}
                      {user.status === 'suspended' && (
                        <DropdownMenuItem
                          onClick={() => {
                            reactivateUser(user.id, actorId);
                            toast({ title: 'User reactivated' });
                          }}
                        >
                          Reactivate Account
                        </DropdownMenuItem>
                      )}
                      {user.status !== 'deactivated' && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeactivateModal(user.id)}
                        >
                          Deactivate Account
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {filtered.map((user) => (
          <div key={user.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">{user.fullName}</p>
              <RoleBadge role={user.role} showIcon={false} />
            </div>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">{user.institution}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full bg-muted px-2 py-0.5 capitalize">
                {user.status.replace('_', ' ')}
              </span>
              {user.domainVerified && (
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-success">verified</span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => setMetricsUserId(user.id)}>
                <BarChart3 className="mr-1 h-3 w-3" />
                Activity
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmationModal
        open={!!suspendModal}
        onOpenChange={() => setSuspendModal(null)}
        title="Suspend User"
        description="This user will be temporarily unable to access the platform."
        confirmLabel="Suspend"
        destructive
        onConfirm={() => {
          if (suspendModal) {
            suspendUser(suspendModal, actorId);
            toast({
              title: 'User suspended',
              description: 'The user account has been suspended.',
            });
          }
        }}
      />

      <ConfirmationModal
        open={!!deactivateModal}
        onOpenChange={() => setDeactivateModal(null)}
        title="Deactivate User"
        description="The user will lose access immediately. They can be reactivated later."
        confirmLabel="Deactivate"
        destructive
        onConfirm={() => {
          if (deactivateModal) {
            deactivateUser(deactivateModal, actorId);
            toast({
              title: 'User deactivated',
              description: 'The user account has been deactivated.',
            });
          }
        }}
      />

      <Dialog open={!!metricsUserId} onOpenChange={(open) => !open && setMetricsUserId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Activity metrics</DialogTitle>
            <DialogDescription>
              {metricsUser ? `${metricsUser.fullName} — ${metricsUser.email}` : ''}
            </DialogDescription>
          </DialogHeader>
          {metrics && (
            <dl className="grid grid-cols-2 gap-3 py-2 text-sm">
              <div className="rounded-2xl border border-border bg-muted/20 p-3">
                <dt className="text-xs text-muted-foreground">Posts created</dt>
                <dd className="text-lg font-semibold tabular-nums">{metrics.postsCreated}</dd>
              </div>
              <div className="rounded-2xl border border-border bg-muted/20 p-3">
                <dt className="text-xs text-muted-foreground">Meetings requested</dt>
                <dd className="text-lg font-semibold tabular-nums">{metrics.meetingsRequested}</dd>
              </div>
              <div className="rounded-2xl border border-border bg-muted/20 p-3">
                <dt className="text-xs text-muted-foreground">Meetings accepted on own posts</dt>
                <dd className="text-lg font-semibold tabular-nums">{metrics.meetingsAccepted}</dd>
              </div>
              <div className="rounded-2xl border border-border bg-muted/20 p-3">
                <dt className="text-xs text-muted-foreground">Messages sent</dt>
                <dd className="text-lg font-semibold tabular-nums">{metrics.messagesSent}</dd>
              </div>
              <div className="col-span-2 rounded-2xl border border-border bg-muted/20 p-3">
                <dt className="text-xs text-muted-foreground">Last logged activity</dt>
                <dd className="text-sm">
                  {metrics.lastActiveAt ? new Date(metrics.lastActiveAt).toLocaleString() : '—'}
                </dd>
              </div>
              <div className="col-span-2 rounded-2xl border border-border bg-muted/20 p-3">
                <dt className="text-xs text-muted-foreground">Total log entries</dt>
                <dd className="text-sm tabular-nums">{metrics.totalLogEntries}</dd>
              </div>
            </dl>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMetricsUserId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default AdminUsersPage;
