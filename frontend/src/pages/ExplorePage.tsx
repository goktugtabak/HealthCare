import { useState, useMemo } from 'react';
import { AppShell } from '@/components/AppShell';
import { PostCard } from '@/components/PostCard';
import { SearchInput, FilterSelect, FilterPanel } from '@/components/FilterComponents';
import { SectionHeader } from '@/components/SharedComponents';
import { mockPosts } from '@/data/mockData';
import { domainOptions, stageOptions } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';

const ExplorePage = () => {
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ domain: 'all', stage: 'all', city: 'all', status: 'all', country: 'all' });

  const cities = [...new Set(mockPosts.map(p => p.city))];
  const countries = [...new Set(mockPosts.map(p => p.country))];

  const filtered = useMemo(() => {
    return mockPosts.filter(p => {
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.shortExplanation.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.domain !== 'all' && p.workingDomain !== filters.domain) return false;
      if (filters.stage !== 'all' && p.projectStage !== filters.stage) return false;
      if (filters.city !== 'all' && p.city !== filters.city) return false;
      if (filters.country !== 'all' && p.country !== filters.country) return false;
      if (filters.status !== 'all' && p.status !== filters.status) return false;
      return true;
    });
  }, [search, filters]);

  const clearFilters = () => setFilters({ domain: 'all', stage: 'all', city: 'all', status: 'all', country: 'all' });

  return (
    <AppShell>
      <SectionHeader title="Explore Posts" description="Discover collaboration opportunities across healthcare innovation." />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by title or description..." />
      </div>

      <FilterPanel filters={filters} onClear={clearFilters}>
        <FilterSelect label="Domain" value={filters.domain} onChange={v => setFilters(f => ({ ...f, domain: v }))} options={domainOptions} />
        <FilterSelect label="Stage" value={filters.stage} onChange={v => setFilters(f => ({ ...f, stage: v }))} options={stageOptions} />
        <FilterSelect label="City" value={filters.city} onChange={v => setFilters(f => ({ ...f, city: v }))} options={cities} />
        <FilterSelect label="Country" value={filters.country} onChange={v => setFilters(f => ({ ...f, country: v }))} options={countries} />
        <FilterSelect label="Status" value={filters.status} onChange={v => setFilters(f => ({ ...f, status: v }))} options={['Draft', 'Active', 'Meeting Scheduled', 'Partner Found', 'Expired']} />
      </FilterPanel>

      <p className="text-sm text-muted-foreground mb-4">{filtered.length} post{filtered.length !== 1 ? 's' : ''} found</p>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(post => {
          const cityMatch = currentUser && post.city === currentUser.city;
          return (
            <div key={post.id} className={cityMatch ? 'ring-2 ring-accent/30 rounded-lg' : ''}>
              {cityMatch && <p className="text-xs text-accent font-medium px-2 pt-1">📍 Same city as you</p>}
              <PostCard post={post} />
            </div>
          );
        })}
      </div>
    </AppShell>
  );
};

export default ExplorePage;
