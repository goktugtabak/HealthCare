import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { PageHero } from '@/components/PageHero';
import { FileText } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { RoleBadge } from '@/components/RoleBadge';
import { SearchInput, FilterSelect, FilterPanel } from '@/components/FilterComponents';
import { Button } from '@/components/ui/button';
import { mockPosts, mockUsers, domainOptions } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const AdminPostsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ domain: 'all', status: 'all' });
  const [posts, setPosts] = useState(mockPosts);

  const filtered = posts.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.domain !== 'all' && p.workingDomain !== filters.domain) return false;
    if (filters.status !== 'all' && p.status !== filters.status) return false;
    return true;
  });

  const removePost = (id: string) => {
    setPosts(ps => ps.filter(p => p.id !== id));
    toast({ title: 'Post removed', description: 'The post has been removed from the platform.' });
  };

  return (
    <AppShell>
      <PageHero
        eyebrow="Admin"
        title="Post Management"
        description="Review and manage all platform posts."
        icon={FileText}
        meta={
          <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
            <span className="tabular-nums">{filtered.length}</span> of {posts.length}
          </span>
        }
      />
      <div className="mb-4"><SearchInput value={search} onChange={setSearch} placeholder="Search posts..." /></div>
      <FilterPanel filters={filters} onClear={() => setFilters({ domain: 'all', status: 'all' })}>
        <FilterSelect label="Domain" value={filters.domain} onChange={v => setFilters(f => ({ ...f, domain: v }))} options={domainOptions} />
        <FilterSelect label="Status" value={filters.status} onChange={v => setFilters(f => ({ ...f, status: v }))} options={['Draft', 'Active', 'Meeting Scheduled', 'Partner Found', 'Expired']} />
      </FilterPanel>

      <div className="hidden md:block rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/50">
            <th className="text-left p-3 font-medium text-muted-foreground">Title</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Owner</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Domain</th>
            <th className="text-left p-3 font-medium text-muted-foreground">City</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Created</th>
            <th className="p-3"></th>
          </tr></thead>
          <tbody>
            {filtered.map(p => {
              const owner = mockUsers.find(u => u.id === p.ownerId);
              return (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium max-w-[200px] truncate">{p.title}</td>
                  <td className="p-3"><div className="flex items-center gap-1.5">{owner && <RoleBadge role={owner.role} showIcon={false} />}<span className="text-muted-foreground">{owner?.fullName}</span></div></td>
                  <td className="p-3 text-muted-foreground">{p.workingDomain}</td>
                  <td className="p-3 text-muted-foreground">{p.city}</td>
                  <td className="p-3"><StatusBadge status={p.status} /></td>
                  <td className="p-3 text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/posts/${p.id}`)}>View Details</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => removePost(p.id)}>Remove Post</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {filtered.map(p => {
          const owner = mockUsers.find(u => u.id === p.ownerId);
          return (
            <div key={p.id} className="rounded-lg border border-border bg-card p-4 cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/posts/${p.id}`)}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-medium truncate">{p.title}</p>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-xs text-muted-foreground">{owner?.fullName} · {p.workingDomain} · {p.city}</p>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
};

export default AdminPostsPage;
