import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { PageHero } from '@/components/PageHero';
import { Users } from 'lucide-react';
import { RoleBadge } from '@/components/RoleBadge';
import { FilterSelect, FilterPanel, SearchInput } from '@/components/FilterComponents';
import { Button } from '@/components/ui/button';
import { mockUsers } from '@/data/mockData';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { toast } from '@/hooks/use-toast';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const AdminUsersPage = () => {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ role: 'all', status: 'all' });
  const [suspendModal, setSuspendModal] = useState<string | null>(null);

  const filtered = mockUsers.filter(u => {
    if (search && !u.fullName.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.role !== 'all' && u.role !== filters.role) return false;
    if (filters.status !== 'all' && u.status !== filters.status) return false;
    return true;
  });

  return (
    <AppShell>
      <PageHero
        eyebrow="Admin"
        title="User Management"
        description="View and manage platform users."
        icon={Users}
        meta={
          <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
            <span className="tabular-nums">{filtered.length}</span> of {mockUsers.length}
          </span>
        }
      />

      <div className="mb-4"><SearchInput value={search} onChange={setSearch} placeholder="Search users..." /></div>

      <FilterPanel filters={filters} onClear={() => setFilters({ role: 'all', status: 'all' })}>
        <FilterSelect label="Role" value={filters.role} onChange={v => setFilters(f => ({ ...f, role: v }))} options={['engineer', 'healthcare', 'admin']} />
        <FilterSelect label="Status" value={filters.status} onChange={v => setFilters(f => ({ ...f, status: v }))} options={['active', 'suspended', 'deactivated']} />
      </FilterPanel>

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/50">
            <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Institution</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Completeness</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
            <th className="p-3"></th>
          </tr></thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="p-3 font-medium">{u.fullName}</td>
                <td className="p-3 text-muted-foreground">{u.email}</td>
                <td className="p-3"><RoleBadge role={u.role} showIcon={false} /></td>
                <td className="p-3 text-muted-foreground">{u.institution}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${u.profileCompleteness}%` }} /></div>
                    <span className="text-xs text-muted-foreground">{u.profileCompleteness}%</span>
                  </div>
                </td>
                <td className="p-3"><span className="capitalize text-xs">{u.status}</span></td>
                <td className="p-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSuspendModal(u.id)}>Suspend Account</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Deactivate Account</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map(u => (
          <div key={u.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">{u.fullName}</p>
              <RoleBadge role={u.role} showIcon={false} />
            </div>
            <p className="text-xs text-muted-foreground">{u.email}</p>
            <p className="text-xs text-muted-foreground">{u.institution}</p>
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
        onConfirm={() => toast({ title: 'User suspended', description: 'The user account has been suspended.' })}
      />
    </AppShell>
  );
};

export default AdminUsersPage;
