import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import {
  CompactNotificationItem,
  CompactPostItem,
  DashboardEmptyPosts,
  DashboardPageHeader,
  DashboardPostPreview,
  DashboardSectionHeading,
  DashboardStatsStrip,
  DashboardSurface,
} from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import type { Post, User } from "@/data/types";
import { Bell, Calendar, Compass, FileText, Plus, Sparkles } from "lucide-react";

const sortNewest = <T extends { createdAt: string }>(items: T[]) =>
  [...items].sort(
    (leftItem, rightItem) =>
      new Date(rightItem.createdAt).getTime() - new Date(leftItem.createdAt).getTime(),
  );

const matchesUser = (post: Post, user: User) => {
  const searchableTags = [
    post.workingDomain,
    ...post.requiredExpertise,
    ...post.matchTags,
  ].map((tag) => tag.toLowerCase());

  if (user.role === "healthcare") {
    return user.interestTags.some((tag) => searchableTags.includes(tag.toLowerCase()));
  }

  if (user.role === "engineer") {
    return user.expertiseTags.some((tag) => searchableTags.includes(tag.toLowerCase()));
  }

  return false;
};

const RequestSnapshot = ({
  title,
  status,
  slot,
}: {
  title: string;
  status: string;
  slot?: string | null;
}) => (
  <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
    <p className="text-sm font-medium text-foreground">{title}</p>
    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{status}</p>
    {slot && (
      <p className="mt-3 text-sm text-muted-foreground">
        {new Date(slot).toLocaleString()}
      </p>
    )}
  </div>
);

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const { meetingRequests, notifications, posts } = usePlatformData();
  const navigate = useNavigate();

  if (!currentUser) {
    return null;
  }

  const firstName = currentUser.fullName.split(" ")[0];
  const myPosts = sortNewest(posts.filter((post) => post.ownerId === currentUser.id));
  const activeFeed = sortNewest(
    posts.filter((post) => post.ownerId !== currentUser.id && post.status === "Active"),
  );
  const relevantFeed = activeFeed.filter((post) => matchesUser(post, currentUser));
  const myNotifications = sortNewest(
    notifications.filter((notification) => notification.userId === currentUser.id),
  );
  const unreadNotifications = myNotifications.filter((notification) => !notification.read).length;
  const myPostIds = myPosts.map((post) => post.id);
  const activeRequests = sortNewest(
    meetingRequests.filter(
      (request) =>
        request.requesterId === currentUser.id ||
        myPostIds.includes(request.postId),
    ),
  );
  const scheduledMeetings = activeRequests.filter((request) => request.status === "Scheduled");

  const stats = [
    {
      label: currentUser.role === "engineer" ? "My Briefs" : "My Announcements",
      value: myPosts.length,
      detail: "High-level posts currently live",
      icon: FileText,
    },
    {
      label: "Relevant Matches",
      value: relevantFeed.length,
      detail: "Posts aligned with your profile",
      icon: Sparkles,
    },
    {
      label: "Meetings",
      value: scheduledMeetings.length,
      detail: "Confirmed first external conversations",
      icon: Calendar,
    },
    {
      label: "Notifications",
      value: unreadNotifications,
      detail: unreadNotifications === 1 ? "Unread update" : "Unread updates",
      icon: Bell,
    },
  ];

  const requestCards = activeRequests.slice(0, 3).map((request) => {
    const requestPost = posts.find((post) => post.id === request.postId);
    return (
      <RequestSnapshot
        key={request.id}
        title={requestPost?.title ?? "Active request"}
        status={request.status}
        slot={request.selectedSlot}
      />
    );
  });

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in">
        <DashboardPageHeader
          eyebrow={
            currentUser.role === "healthcare"
              ? "Healthcare discovery workspace"
              : "Engineer launchpad"
          }
          title={`Welcome back, ${firstName}`}
          description={
            currentUser.role === "healthcare"
              ? "See the newest announcements first, keep your profile-driven matches visible, and move promising introductions toward an external meeting."
              : "Open the workspace with your post action visible, review the latest announcements, and keep first-contact conversations moving."
          }
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="rounded-full px-4"
                onClick={() => navigate("/create-post")}
              >
                <Plus className="mr-1 h-4 w-4" />
                New Post
              </Button>
              {currentUser.role === "healthcare" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full px-4"
                  onClick={() => navigate("/explore")}
                >
                  <Compass className="mr-1 h-4 w-4" />
                  Search Posts
                </Button>
              )}
            </div>
          }
        />

        <DashboardStatsStrip items={stats} />

        {currentUser.role === "engineer" ? (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_340px]">
            <DashboardSurface className="p-6 sm:p-8">
              <DashboardSectionHeading
                title="Latest opportunities"
                description="Newest active posts, sorted to keep the first action obvious and the feed easy to scan."
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={() => navigate("/explore")}
                  >
                    Explore all
                  </Button>
                }
                className="mb-2"
              />

              {activeFeed.length > 0 ? (
                <div className="mt-6 divide-y divide-border/60">
                  {activeFeed.slice(0, 4).map((post) => (
                    <DashboardPostPreview key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <DashboardEmptyPosts />
              )}
            </DashboardSurface>

            <div className="space-y-6">
              <DashboardSurface className="p-5 sm:p-6">
                <DashboardSectionHeading
                  title="Requests in motion"
                  description="Pending or scheduled intros tied to your work."
                  className="mb-4"
                />
                {requestCards.length > 0 ? (
                  <div className="space-y-3">{requestCards}</div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No requests yet. Publish a post or explore a few opportunities first.
                  </p>
                )}
              </DashboardSurface>

              <DashboardSurface className="p-5 sm:p-6">
                <DashboardSectionHeading
                  title="My posts"
                  description={
                    myPosts.length > 0
                      ? `${myPosts.length} post${myPosts.length === 1 ? "" : "s"} in progress`
                      : "No posts created yet"
                  }
                  action={
                    myPosts.length > 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                        onClick={() => navigate("/my-posts")}
                      >
                        View all
                      </Button>
                    ) : undefined
                  }
                  className="mb-4"
                />
                {myPosts.length > 0 ? (
                  <div className="space-y-1">
                    {myPosts.slice(0, 3).map((post) => (
                      <CompactPostItem key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Your next best action is the new post button at the top of this page.
                  </p>
                )}
              </DashboardSurface>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.65fr)_340px]">
            <div className="space-y-8">
              <DashboardSurface className="p-6 sm:p-8">
                <DashboardSectionHeading
                  title="Recommended for your interests"
                  description="Posts that align with the interest tags you provided during onboarding."
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      onClick={() => navigate("/explore")}
                    >
                      Explore all
                    </Button>
                  }
                  className="mb-2"
                />
                {currentUser.interestTags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {currentUser.interestTags.slice(0, 6).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {relevantFeed.length > 0 ? (
                  <div className="mt-6 divide-y divide-border/60">
                    {relevantFeed.slice(0, 3).map((post) => (
                      <DashboardPostPreview key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <DashboardEmptyPosts />
                )}
              </DashboardSurface>

              <DashboardSurface className="p-6 sm:p-8">
                <DashboardSectionHeading
                  title="Newest announcements"
                  description="Newest-first active posts so you can scan the platform without extra clicks."
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      onClick={() => navigate("/explore")}
                    >
                      Browse feed
                    </Button>
                  }
                  className="mb-2"
                />
                {activeFeed.length > 0 ? (
                  <div className="mt-6 divide-y divide-border/60">
                    {activeFeed.slice(0, 4).map((post) => (
                      <DashboardPostPreview key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <DashboardEmptyPosts />
                )}
              </DashboardSurface>
            </div>

            <div className="space-y-6">
              <DashboardSurface className="p-5 sm:p-6">
                <DashboardSectionHeading
                  title="Notifications"
                  description={
                    unreadNotifications > 0
                      ? `${unreadNotifications} unread updates`
                      : "All caught up"
                  }
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      onClick={() => navigate("/notifications")}
                    >
                      View all
                    </Button>
                  }
                  className="mb-4"
                />
                {myNotifications.length > 0 ? (
                  <div className="space-y-1">
                    {myNotifications.slice(0, 3).map((notification) => (
                      <CompactNotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={() => navigate("/notifications")}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No notifications yet.</p>
                )}
              </DashboardSurface>

              <DashboardSurface className="p-5 sm:p-6">
                <DashboardSectionHeading
                  title="My announcements"
                  description={
                    myPosts.length > 0
                      ? `${myPosts.length} post${myPosts.length === 1 ? "" : "s"} in progress`
                      : "No announcements created yet"
                  }
                  action={
                    myPosts.length > 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                        onClick={() => navigate("/my-posts")}
                      >
                        View all
                      </Button>
                    ) : undefined
                  }
                  className="mb-4"
                />
                {myPosts.length > 0 ? (
                  <div className="space-y-1">
                    {myPosts.slice(0, 3).map((post) => (
                      <CompactPostItem key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Create a brief announcement when you are ready to invite first-contact requests.
                  </p>
                )}
              </DashboardSurface>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default DashboardPage;
