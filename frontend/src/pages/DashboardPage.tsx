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
import { useChatDock } from "@/contexts/ChatDockContext";
import {
  Bell,
  Compass,
  FileText,
  MessageCircle,
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

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const { messages, notifications, posts, users } = usePlatformData();
  const { openDock } = useChatDock();
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
  const myMessages = messages.filter(
    (message) =>
      message.senderId === currentUser.id ||
      message.recipientId === currentUser.id,
  );
  const unreadMessages = myMessages.filter(
    (message) => message.recipientId === currentUser.id && !message.readAt,
  ).length;
  const activeThreads = new Set(
    myMessages.map((message) => {
      const other =
        message.senderId === currentUser.id
          ? message.recipientId
          : message.senderId;
      return `${message.postId}::${other}`;
    }),
  ).size;

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

    if (unreadMessages > 0) {
      return {
        headline: `${unreadMessages} unread message${unreadMessages === 1 ? "" : "s"}`,
        description:
          "Someone started a conversation about one of your posts. Open the chat to reply.",
        ctaLabel: "Open chat",
        to: "/dashboard",
        icon: MessageCircle,
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
    unreadMessages,
    unreadNotifications,
    myPosts.length,
    relevantFeed.length,
  ]);

  const onboardingSteps = buildOnboardingSteps(
    currentUser,
    myPosts.length > 0,
    myMessages.length > 0,
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
      label: "Conversations",
      value: activeThreads,
      detail:
        unreadMessages > 0
          ? `${unreadMessages} unread`
          : "Active threads",
      icon: MessageCircle,
      tone: (unreadMessages > 0 ? "warning" : "success") as
        | "warning"
        | "success",
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

  const recentConversations = (() => {
    const byThread = new Map<
      string,
      { postId: string; otherUserId: string; last: (typeof myMessages)[number] }
    >();
    for (const message of myMessages) {
      const other =
        message.senderId === currentUser.id
          ? message.recipientId
          : message.senderId;
      const key = `${message.postId}::${other}`;
      const existing = byThread.get(key);
      if (
        !existing ||
        new Date(message.createdAt).getTime() >
          new Date(existing.last.createdAt).getTime()
      ) {
        byThread.set(key, {
          postId: message.postId,
          otherUserId: other,
          last: message,
        });
      }
    }
    return Array.from(byThread.values())
      .sort(
        (a, b) =>
          new Date(b.last.createdAt).getTime() -
          new Date(a.last.createdAt).getTime(),
      )
      .slice(0, 3);
  })();

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
                <div className="mt-6 flex flex-col gap-4">
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
                  title="Recent conversations"
                  description="Latest chats about your posts."
                  className="mb-4"
                />
                {recentConversations.length > 0 ? (
                  <div className="space-y-2">
                    {recentConversations.map((conversation) => {
                      const threadPost = posts.find(
                        (post) => post.id === conversation.postId,
                      );
                      const other = users.find(
                        (user) => user.id === conversation.otherUserId,
                      );
                      return (
                        <button
                          key={`${conversation.postId}-${conversation.otherUserId}`}
                          type="button"
                          onClick={() =>
                            openDock({
                              postId: conversation.postId,
                              otherUserId: conversation.otherUserId,
                            })
                          }
                          className="flex w-full flex-col gap-1 rounded-2xl border border-border/60 bg-background/60 p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
                        >
                          <span className="truncate text-sm font-medium">
                            {other?.fullName ?? "Unknown user"}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            Re: {threadPost?.title ?? "Post"}
                          </span>
                          <span className="truncate text-xs text-muted-foreground/80">
                            {conversation.last.senderId === currentUser.id
                              ? "You: "
                              : ""}
                            {conversation.last.content}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No chats yet. Publish a post or explore opportunities to start one.
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
