import { useAuth } from '@/contexts/AuthContext';
import { AppShell } from '@/components/AppShell';
import { SectionHeader, StatsCard, NotificationItem } from '@/components/SharedComponents';
import { PostCard } from '@/components/PostCard';
import { Button } from '@/components/ui/button';
import { mockPosts, mockNotifications, mockMeetingRequests } from '@/data/mockData';
import { FileText, Users, Calendar, Bell, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const myPosts = mockPosts.filter(p => p.ownerId === currentUser.id);
  const relevantPosts = mockPosts.filter(p => p.ownerId !== currentUser.id && p.status === 'Active');
  const myNotifications = mockNotifications.filter(n => n.userId === currentUser.id);
  const upcomingMeetings = mockMeetingRequests.filter(mr => mr.status === 'Scheduled');

  return (
    <AppShell>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Welcome back, {currentUser.fullName.split(' ')[0]}</h1>
          <p className="text-sm text-muted-foreground mt-1">Find the right interdisciplinary partner faster.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard label="My Posts" value={myPosts.length} icon={FileText} />
          <StatsCard label="Active Posts" value={mockPosts.filter(p => p.status === 'Active').length} icon={Users} />
          <StatsCard label="Upcoming Meetings" value={upcomingMeetings.length} icon={Calendar} />
          <StatsCard label="Notifications" value={myNotifications.filter(n => !n.read).length} icon={Bell} />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <SectionHeader
              title="Relevant Posts"
              description="Posts matching your expertise area"
              action={<Button size="sm" onClick={() => navigate('/create-post')}><Plus className="h-4 w-4 mr-1" /> New Post</Button>}
            />
            <div className="grid gap-4">
              {relevantPosts.slice(0, 4).map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full" onClick={() => navigate('/explore')}>View All Posts</Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div>
              <SectionHeader title="Notifications" />
              <div className="space-y-1">
                {myNotifications.slice(0, 3).map(n => (
                  <NotificationItem key={n.id} title={n.title} message={n.message} time={new Date(n.createdAt).toLocaleDateString()} read={n.read} />
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => navigate('/notifications')}>
                View All Notifications
              </Button>
            </div>

            {myPosts.length > 0 && (
              <div>
                <SectionHeader title="My Posts" />
                {myPosts.slice(0, 2).map(post => (
                  <div key={post.id} className="rounded-lg border border-border p-3 mb-2 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/posts/${post.id}`)}>
                    <p className="text-sm font-medium truncate">{post.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{post.status} · {post.workingDomain}</p>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate('/my-posts')}>View All My Posts</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default DashboardPage;
