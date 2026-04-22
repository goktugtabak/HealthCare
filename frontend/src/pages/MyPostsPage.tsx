import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { PageHero } from "@/components/PageHero";
import { EmptyState } from "@/components/SharedComponents";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { FileText, Plus } from "lucide-react";
import type { Post, PostStatus } from "@/data/types";

type StatusFilter = "all" | "Active" | "Draft" | "Meeting Scheduled" | "Partner Found" | "Expired";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "Active", label: "Active" },
  { key: "Draft", label: "Drafts" },
  { key: "Meeting Scheduled", label: "Meetings" },
  { key: "Partner Found", label: "Partnered" },
  { key: "Expired", label: "Expired" },
];

const countByStatus = (posts: Post[], status: PostStatus | "all") =>
  status === "all" ? posts.length : posts.filter((post) => post.status === status).length;

const MyPostsPage = () => {
  const { currentUser } = useAuth();
  const { posts, meetingRequests } = usePlatformData();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<StatusFilter>("all");

  if (!currentUser) {
    return null;
  }

  const myPosts = useMemo(
    () =>
      [...posts]
        .filter((post) => post.ownerId === currentUser.id)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
    [posts, currentUser.id],
  );

  const visiblePosts =
    filter === "all" ? myPosts : myPosts.filter((post) => post.status === filter);

  const activeCount = countByStatus(myPosts, "Active");
  const pendingRequestCount = meetingRequests.filter(
    (request) =>
      myPosts.some((post) => post.id === request.postId) &&
      request.status === "Pending",
  ).length;

  return (
    <AppShell>
      <PageHero
        eyebrow="Your workspace"
        title="My posts"
        description="Manage every brief attached to your profile. Pending requests surface first so nothing falls through."
        icon={FileText}
        meta={
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground ring-1 ring-border/60">
              <span className="tabular-nums">{myPosts.length}</span> total
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--info))]/10 px-3 py-1 text-xs font-medium text-[hsl(var(--info))] ring-1 ring-[hsl(var(--info))]/20">
              <span className="tabular-nums">{activeCount}</span> live
            </span>
            {pendingRequestCount > 0 && (
              <button
                type="button"
                onClick={() => navigate("/meetings")}
                className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--warning))]/15 px-3 py-1 text-xs font-semibold text-[hsl(var(--warning))] ring-1 ring-[hsl(var(--warning))]/25 transition-colors hover:bg-[hsl(var(--warning))]/25"
              >
                <span className="tabular-nums">{pendingRequestCount}</span> pending
                request{pendingRequestCount === 1 ? "" : "s"} →
              </button>
            )}
          </div>
        }
        action={
          <Button
            size="sm"
            className="rounded-full px-4"
            onClick={() => navigate("/create-post")}
          >
            <Plus className="mr-1 h-4 w-4" />
            New Post
          </Button>
        }
      />

      {myPosts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No posts yet"
          description="Publish your first brief to start meeting collaborators aligned with your work."
          action={
            <Button
              className="rounded-full"
              onClick={() => navigate("/create-post")}
            >
              <Plus className="mr-1 h-4 w-4" />
              Create first post
            </Button>
          }
        />
      ) : (
        <>
          <div
            role="tablist"
            className="mb-6 flex flex-wrap gap-1 rounded-full bg-muted p-1"
          >
            {STATUS_TABS.map((tab) => {
              const count = countByStatus(myPosts, tab.key as PostStatus | "all");
              const isActive = filter === tab.key;
              if (count === 0 && tab.key !== "all") return null;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                    isActive
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-muted-foreground/10",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {visiblePosts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {visiblePosts.map((post) => (
                <PostCard key={post.id} post={post} ownerMode />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
              No posts in this category yet.
            </div>
          )}
        </>
      )}
    </AppShell>
  );
};

export default MyPostsPage;
