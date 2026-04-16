import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { SearchInput, FilterSelect } from "@/components/FilterComponents";
import { SectionHeader } from "@/components/SharedComponents";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import { domainOptions } from "@/data/mockData";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const ExplorePage = () => {
  const { currentUser } = useAuth();
  const { posts } = usePlatformData();
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("all");
  const [relevantOnly, setRelevantOnly] = useState(false);

  if (!currentUser) {
    return null;
  }

  const interestSource =
    currentUser.role === "healthcare" ? currentUser.interestTags : currentUser.expertiseTags;

  const filteredPosts = useMemo(() => {
    const activePosts = posts
      .filter((post) => post.status === "Active" && post.ownerId !== currentUser.id)
      .sort(
        (leftPost, rightPost) =>
          new Date(rightPost.createdAt).getTime() - new Date(leftPost.createdAt).getTime(),
      );

    return activePosts.filter((post) => {
      const haystack = [post.title, post.shortExplanation, post.workingDomain]
        .join(" ")
        .toLowerCase();
      const relatedTags = [post.workingDomain, ...post.requiredExpertise, ...post.matchTags].map(
        (tag) => tag.toLowerCase(),
      );
      const isRelevant = interestSource.some((tag) => relatedTags.includes(tag.toLowerCase()));

      if (search && !haystack.includes(search.toLowerCase())) return false;
      if (domain !== "all" && post.workingDomain !== domain) return false;
      if (relevantOnly && !isRelevant) return false;

      return true;
    });
  }, [currentUser.id, domain, interestSource, posts, relevantOnly, search]);

  return (
    <AppShell>
      <SectionHeader
        title="Explore posts"
        description="Newest-first discovery with light filtering and profile-aware highlights."
      />

      <div className="mb-6 grid gap-4 rounded-[28px] border border-border bg-card p-4 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-end">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by title, domain, or summary..."
        />
        <FilterSelect label="Domain" value={domain} onChange={setDomain} options={domainOptions} />
        <div className="flex h-9 items-center gap-2 rounded-xl border border-border px-3">
          <Checkbox
            id="relevantOnly"
            checked={relevantOnly}
            onCheckedChange={(checked) => setRelevantOnly(!!checked)}
          />
          <Label htmlFor="relevantOnly" className="text-sm text-muted-foreground">
            Relevant to me
          </Label>
        </div>
      </div>

      {interestSource.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {interestSource.slice(0, 8).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className="mb-4 text-sm text-muted-foreground">
        {filteredPosts.length} post{filteredPosts.length !== 1 ? "s" : ""} found, sorted by newest
        first
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredPosts.map((post) => {
          const relatedTags = [post.workingDomain, ...post.requiredExpertise, ...post.matchTags].map(
            (tag) => tag.toLowerCase(),
          );
          const isRelevant = interestSource.some((tag) => relatedTags.includes(tag.toLowerCase()));

          return (
            <PostCard
              key={post.id}
              post={post}
              highlightLabel={isRelevant ? "Relevant to your profile" : undefined}
            />
          );
        })}
      </div>

      {filteredPosts.length === 0 && (
        <div className="rounded-[28px] border border-dashed border-border bg-card px-6 py-14 text-center text-sm text-muted-foreground">
          No posts match your current filters. Try removing the relevance filter or broadening the
          search.
        </div>
      )}
    </AppShell>
  );
};

export default ExplorePage;
