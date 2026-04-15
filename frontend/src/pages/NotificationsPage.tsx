import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { SectionHeader, NotificationItem } from '@/components/SharedComponents';
import { mockNotifications } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const NotificationsPage = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState(mockNotifications);

  if (!currentUser) return null;

  const myNotifs = notifications.filter(n => n.userId === currentUser.id);

  const markAllRead = () => {
    setNotifications(ns => ns.map(n => n.userId === currentUser.id ? { ...n, read: true } : n));
  };

  return (
    <AppShell>
      <SectionHeader
        title="Notifications"
        action={<Button variant="outline" size="sm" onClick={markAllRead}>Mark All Read</Button>}
      />
      <div className="max-w-2xl space-y-1 animate-fade-in">
        {myNotifs.map(n => (
          <NotificationItem
            key={n.id}
            title={n.title}
            message={n.message}
            time={new Date(n.createdAt).toLocaleString()}
            read={n.read}
            onClick={() => setNotifications(ns => ns.map(notif => notif.id === n.id ? { ...notif, read: true } : notif))}
          />
        ))}
        {myNotifs.length === 0 && <p className="text-center py-16 text-sm text-muted-foreground">No notifications.</p>}
      </div>
    </AppShell>
  );
};

export default NotificationsPage;
