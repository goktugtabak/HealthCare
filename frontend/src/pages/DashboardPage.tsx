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
import {
  mockMeetingRequests,
  mockNotifications,
  mockPosts,
} from "@/data/mockData";
import { Bell, Calendar, FileText, Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) {
    return null;
  }

  const myPosts = mockPosts.filter((post) => post.ownerId === currentUser.id);
  const relevantPosts = mockPosts.filter(
    (post) => post.ownerId !== currentUser.id && post.status === "Active",
  );
  const myNotifications = mockNotifications.filter(
    (notification) => notification.userId === currentUser.id,
  );
  const upcomingMeetings = mockMeetingRequests.filter(
    (request) =>
      request.status === "Scheduled" &&
      (request.requesterId === currentUser.id ||
        myPosts.some((post) => post.id === request.postId)),
  );

  const isHealthcareUser = currentUser.role === "healthcare";
  const firstName = currentUser.fullName.split(" ")[0];
  const unreadNotifications = myNotifications.filter(
    (notification) => !notification.read,
  ).length;
  const stats = [
    {
      label: "My Posts",
      value: myPosts.length,
      detail: "Current collaboration listings",
      icon: FileText,
    },
    {
      label: "Active Posts",
      value: mockPosts.filter((post) => post.status === "Active").length,
      detail: "Open opportunities across the platform",
      icon: Users,
    },
    {
      label: "Upcoming Meetings",
      value: upcomingMeetings.length,
      detail: "Confirmed meetings tied to your work",
      icon: Calendar,
    },
    {
      label: "Notifications",
      value: unreadNotifications,
      detail: unreadNotifications === 1 ? "Unread update" : "Unread updates",
      icon: Bell,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in">
        <DashboardPageHeader
          eyebrow={
            isHealthcareUser
              ? "Healthcare Professional Dashboard"
              : "Collaboration Dashboard"
          }
          title={`Welcome back, ${firstName}`}
          description={
            isHealthcareUser
              ? "Review the strongest collaboration opportunities, monitor updates around your posts, and keep promising conversations moving."
              : "Check active collaboration signals, review high-value opportunities, and keep your current work on track."
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

        <DashboardStatsStrip items={stats} />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.65fr)_340px]">
          <DashboardSurface className="p-6 sm:p-8">
            <DashboardSectionHeading
              title="Relevant Posts"
              description="A focused snapshot of active opportunities worth reviewing now."
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={() => navigate("/explore")}
                >
                  Explore All
                </Button>
              }
              className="mb-2"
            />

            {relevantPosts.length > 0 ? (
              <>
                <div className="mt-6 divide-y divide-border/60">
                  {relevantPosts.slice(0, 3).map((post) => (
                    <DashboardPostPreview key={post.id} post={post} />
                  ))}
                </div>
                <div className="mt-6 flex justify-start">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full px-4"
                    onClick={() => navigate("/explore")}
                  >
                    View All Posts
                  </Button>
                </div>
              </>
            ) : (
              <DashboardEmptyPosts />
            )}
          </DashboardSurface>

          <DashboardSurface className="h-fit p-5 sm:p-6 xl:sticky xl:top-24">
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
                  View All
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
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No notifications yet.
              </p>
            )}

            <div className="my-6 h-px bg-border/60" />

            <DashboardSectionHeading
              title="My Posts"
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
                    View All
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
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Create your first post to start attracting collaborators.
              </p>
            )}
          </DashboardSurface>
        </div>
      </div>
    </AppShell>
  );
};

export default DashboardPage;
