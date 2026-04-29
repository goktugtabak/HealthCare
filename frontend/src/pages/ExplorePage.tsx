import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { PageHero } from "@/components/PageHero";
import { SearchInput, FilterSelect } from "@/components/FilterComponents";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import { domainOptions } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Compass, Sparkles, X } from "lucide-react";

type SortMode = "relevance" | "newest";

const ExplorePage = () => {
  const { currentUser } = useAuth();
  const { posts } = usePlatformData();
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("all");
  const [city, setCity] = useState("all");
  const [country, setCountry] = useState("all");
  const [sameCityOnly, setSameCityOnly] = useState(false);
  const [relevantOnly, setRelevantOnly] = useState(false);
  const [sort, setSort] = useState<SortMode>("relevance");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const cityOptions = useMemo(
    () => [...new Set(posts.map((post) => post.city).filter(Boolean))].sort(),
    [posts],
  );
  const countryOptions = useMemo(
    () => [...new Set(posts.map((post) => post.country).filter(Boolean))].sort(),
    [posts],
  );

  if (!currentUser) {
    return null;
  }

  const interestSource =
    currentUser.role === "healthcare"
      ? currentUser.interestTags
      : currentUser.expertiseTags;

  const results = useMemo(() => {
    const base = posts.filter(
      (post) => post.status === "Active" && post.ownerId !== currentUser.id,
    );

    const withScore = base.map((post) => {
      const relatedTags = [
        post.workingDomain,
        ...post.requiredExpertise,
        ...post.matchTags,
      ].map((tag) => tag.toLowerCase());

      const matched = interestSource.filter((tag) =>
        relatedTags.includes(tag.toLowerCase()),
      );

      return { post, matched, matchCount: matched.length };
    });

    const filtered = withScore.filter(({ post, matchCount }) => {
      const haystack = [post.title, post.shortExplanation, post.workingDomain]
        .join(" ")
        .toLowerCase();
      const relatedTags = [
        post.workingDomain,
        ...post.requiredExpertise,
        ...post.matchTags,
      ].map((tag) => tag.toLowerCase());

      if (search && !haystack.includes(search.toLowerCase())) return false;
      if (domain !== "all" && post.workingDomain !== domain) return false;
      if (city !== "all" && post.city !== city) return false;
      if (country !== "all" && post.country !== country) return false;
      if (
        sameCityOnly &&
        currentUser.city &&
        post.city.toLowerCase() !== currentUser.city.toLowerCase()
      )
        return false;
      if (relevantOnly && matchCount === 0) return false;
      if (activeTag && !relatedTags.includes(activeTag.toLowerCase())) return false;

      return true;
    });

    if (sort === "relevance") {
      filtered.sort((a, b) => {
        if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
        return (
          new Date(b.post.createdAt).getTime() -
          new Date(a.post.createdAt).getTime()
        );
      });
    } else {
      filtered.sort(
        (a, b) =>
          new Date(b.post.createdAt).getTime() -
          new Date(a.post.createdAt).getTime(),
      );
    }

    return filtered;
  }, [
    activeTag,
    city,
    country,
    currentUser.city,
    currentUser.id,
    domain,
    interestSource,
    posts,
    relevantOnly,
    sameCityOnly,
    search,
    sort,
  ]);

  const relevantCount = results.filter((entry) => entry.matchCount > 0).length;
  const filtersActive =
    Boolean(search) ||
    domain !== "all" ||
    city !== "all" ||
    country !== "all" ||
    sameCityOnly ||
    relevantOnly ||
    activeTag !== null ||
    sort !== "relevance";

  const clearAll = () => {
    setSearch("");
    setDomain("all");
    setCity("all");
    setCountry("all");
    setSameCityOnly(false);
    setRelevantOnly(false);
    setActiveTag(null);
    setSort("relevance");
  };

  return (
    <AppShell>
      <PageHero
        eyebrow="Discovery"
        title="Explore posts"
        description="Newest opportunities, sorted by how well they match your profile. Tap a tag to drill down."
        icon={Compass}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground ring-1 ring-border/60">
              <span className="tabular-nums">{results.length}</span>
              {results.length === 1 ? " post" : " posts"}
            </span>
            {relevantCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent ring-1 ring-accent/20">
                <Sparkles className="h-3 w-3" />
                <span className="tabular-nums">{relevantCount}</span>
                {" match"}
                {relevantCount === 1 ? "" : "es"}
              </span>
            )}
          </div>
        }
      />

      <div className="sticky top-0 z-20 -mx-1 mb-6 rounded-[28px] bg-card/95 p-4 shadow-sm ring-1 ring-border/60 backdrop-blur supports-[backdrop-filter]:bg-card/75">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px_auto_auto] lg:items-end">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search title, domain, or summary..."
          />
          <FilterSelect
            label="Domain"
            value={domain}
            onChange={setDomain}
            options={domainOptions}
          />
          <FilterSelect
            label="City"
            value={city}
            onChange={setCity}
            options={cityOptions}
          />
          <FilterSelect
            label="Country"
            value={country}
            onChange={setCountry}
            options={countryOptions}
          />
          <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1">
            <button
              type="button"
              onClick={() => setSort("relevance")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                sort === "relevance"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Relevance
            </button>
            <button
              type="button"
              onClick={() => setSort("newest")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                sort === "newest"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Newest
            </button>
          </div>
          <button
            type="button"
            onClick={() => setRelevantOnly((prev) => !prev)}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-medium transition-colors",
              relevantOnly
                ? "bg-accent text-accent-foreground shadow-sm"
                : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground",
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Relevant to me
          </button>
        </div>

        {currentUser.city && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSameCityOnly((prev) => !prev)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors",
                sameCityOnly
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground",
              )}
            >
              Same city as me ({currentUser.city})
            </button>
          </div>
        )}

        {interestSource.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Your tags
            </span>
            {interestSource.slice(0, 10).map((tag) => {
              const isActive = activeTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(isActive ? null : tag)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-primary/10 text-primary hover:bg-primary/15",
                  )}
                >
                  {tag}
                </button>
              );
            })}
            {filtersActive && (
              <button
                type="button"
                onClick={clearAll}
                className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {results.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map(({ post, matched, matchCount }) => (
            <PostCard
              key={post.id}
              post={post}
              matchCount={matchCount}
              matchedTags={matched}
              highlightLabel={
                matchCount > 0
                  ? `${matchCount} tag${matchCount === 1 ? "" : "s"} matched`
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-border bg-card px-6 py-16 text-center">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Compass className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Nothing matches those filters
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try broadening the search, clearing the relevance filter, or picking a
            different domain.
          </p>
          {filtersActive && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-full"
              onClick={clearAll}
            >
              <X className="mr-1 h-3 w-3" />
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </AppShell>
  );
};

export default ExplorePage;
