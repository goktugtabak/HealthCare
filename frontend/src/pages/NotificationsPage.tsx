import { AppShell } from "@/components/AppShell";
import { NotificationItem, SectionHeader } from "@/components/SharedComponents";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformData } from "@/contexts/PlatformDataContext";

const NotificationsPage = () => {
  const { currentUser } = useAuth();
  const { markAllNotificationsRead, markNotificationRead, notifications } = usePlatformData();

  if (!currentUser) return null;

  const myNotifications = [...notifications]
    .filter((notification) => notification.userId === currentUser.id)
    .sort(
      (leftNotification, rightNotification) =>
        new Date(rightNotification.createdAt).getTime() -
        new Date(leftNotification.createdAt).getTime(),
    );

  return (
    <AppShell>
      <SectionHeader
        title="Notifications"
        description="In-app updates are live. Email notifications remain planned/mock until backend delivery exists."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllNotificationsRead(currentUser.id)}
          >
            Mark All Read
          </Button>
        }
      />
      <div className="max-w-2xl space-y-1 animate-fade-in">
        {myNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            title={notification.title}
            message={notification.message}
            time={new Date(notification.createdAt).toLocaleString()}
            read={notification.read}
            onClick={() => markNotificationRead(notification.id)}
          />
        ))}
        {myNotifications.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">No notifications.</p>
        )}
      </div>
    </AppShell>
  );
};

export default NotificationsPage;
