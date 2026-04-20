import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import {
  CompactNotificationItem,
  CompactPostItem,
  DashboardEmptyPosts,
  DashboardPostPreview,
  DashboardSectionHeading,
  DashboardStatsStrip,
  DashboardSurface,
} from "@/components/DashboardComponents";
import {
  DashboardHero,
  buildOnboardingSteps,
  type NextBestAction,
} from "@/components/DashboardHero";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import type { Post, User } from "@/data/types";
import {
  Bell,
  Calendar,
  Compass,
  FileText,
  Plus,
  Sparkles,
  UserCircle2,
} from "lucide-react";

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
  const pendingRequests = activeRequests.filter((request) => request.status === "Pending");

  const nextAction: NextBestAction = useMemo(() => {
    if (currentUser.profileCompleteness < 60) {
      return {
        headline: "Finish your profile to unlock matches",
        description: `Your profile is ${currentUser.profileCompleteness}% complete. Add expertise tags so the platform can surface the right opportunities.`,
        ctaLabel: "Complete profile",
        to: "/profile",
        icon: UserCircle2,
        tone: "accent",
      };
    }

    if (pendingRequests.length > 0) {
      return {
        headline: `${pendingRequests.length} meeting request${pendingRequests.length === 1 ? "" : "s"} waiting`,
        description:
          "Someone wants to start a first-contact conversation. Review and respond to keep momentum.",
        ctaLabel: "Review",
        to: "/meetings",
        icon: Calendar,
        tone: "primary",
      };
    }

    if (unreadNotifications > 0) {
      return {
        headline: `${unreadNotifications} unread update${unreadNotifications === 1 ? "" : "s"}`,
        description:
          "New activity since your last visit. Check what changed before picking your next move.",
        ctaLabel: "See updates",
        to: "/notifications",
        icon: Bell,
        tone: "accent",
      };
    }

    if (currentUser.role === "engineer" && myPosts.length === 0) {
      return {
        headline: "Publish your first project brief",
        description:
          "Share what you are building to attract healthcare collaborators aligned with your stage and domain.",
        ctaLabel: "New post",
        to: "/create-post",
        icon: Plus,
        tone: "primary",
      };
    }

    if (currentUser.role === "healthcare" && relevantFeed.length > 0) {
      return {
        headline: `${relevantFeed.length} match${relevantFeed.length === 1 ? "" : "es"} aligned with your interests`,
        description:
          "Fresh posts matching your interest tags — open one to start a first-contact message.",
        ctaLabel: "Review matches",
        to: "/explore",
        icon: Sparkles,
        tone: "primary",
      };
    }

    return {
      headline: "Explore the latest opportunities",
      description:
        "Browse the newest active posts to find your next collaboration.",
      ctaLabel: "Explore",
      to: "/explore",
      icon: Compass,
      tone: "accent",
    };
  }, [
    currentUser,
    pendingRequests.length,
    unreadNotifications,
    myPosts.length,
    relevantFeed.length,
  ]);

  const onboardingSteps = buildOnboardingSteps(
    currentUser,
    myPosts.length > 0,
    activeRequests.length > 0,
  );

  const stats = [
    {
      label: currentUser.role === "engineer" ? "My Briefs" : "My Announcements",
      value: myPosts.length,
      detail: "Currently live",
      icon: FileText,
      tone: "info" as const,
      action:
        myPosts.length > 0
          ? { label: "Manage", to: "/my-posts" }
          : undefined,
    },
    {
      label: "Relevant Matches",
      value: relevantFeed.length,
      detail: "Aligned with your profile",
      icon: Sparkles,
      tone: "accent" as const,
      trend:
        relevantFeed.length > 0
          ? { direction: "up" as const, label: "fresh" }
          : undefined,
      action:
        relevantFeed.length > 0
          ? { label: "Explore", to: "/explore" }
          : undefined,
    },
    {
      label: "Meetings",
      value: scheduledMeetings.length,
      detail:
        pendingRequests.length > 0
          ? `${pendingRequests.length} pending`
          : "Confirmed intros",
      icon: Calendar,
      tone: (pendingRequests.length > 0 ? "warning" : "success") as
        | "warning"
        | "success",
      action:
        activeRequests.length > 0
          ? { label: "View all", to: "/meetings" }
          : undefined,
    },
    {
      label: "Notifications",
      value: unreadNotifications,
      detail: unreadNotifications === 1 ? "Unread update" : "Unread updates",
      icon: Bell,
      tone: (unreadNotifications > 0 ? "warning" : "neutral") as
        | "warning"
        | "neutral",
      action:
        myNotifications.length > 0
          ? { label: "View", to: "/notifications" }
          : undefined,
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
        <DashboardHero
          user={currentUser}
          eyebrow={
            currentUser.role === "healthcare"
              ? "Healthcare discovery workspace"
              : "Engineer launchpad"
          }
          nextAction={nextAction}
          steps={onboardingSteps}
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
                  <DashboardEmptyPosts
                    title="No posts yet"
                    description="Publish your first brief to start attracting collaborators."
                    actionLabel="Create post"
                    to="/create-post"
                  />
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
                  <DashboardEmptyPosts
                    title="No matches yet"
                    description="Add more interest tags to your profile or browse the full feed."
                    actionLabel="Open profile"
                    to="/profile"
                  />
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
                  <DashboardEmptyPosts
                    title="No announcements yet"
                    description="Share a challenge you are facing to invite first-contact requests."
                    actionLabel="Create announcement"
                    to="/create-post"
                  />
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
