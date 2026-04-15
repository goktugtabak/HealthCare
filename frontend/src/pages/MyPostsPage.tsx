import { AppShell } from '@/components/AppShell';
import { PostCard } from '@/components/PostCard';
import { SectionHeader, EmptyState } from '@/components/SharedComponents';
import { Button } from '@/components/ui/button';
import { mockPosts } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';

const MyPostsPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  if (!currentUser) return null;

  const myPosts = mockPosts.filter(p => p.ownerId === currentUser.id);

  return (
    <AppShell>
      <SectionHeader
        title="My Posts"
        description="Manage your collaboration opportunities."
        action={<Button size="sm" onClick={() => navigate('/create-post')}><Plus className="h-4 w-4 mr-1" /> New Post</Button>}
      />
      {myPosts.length === 0 ? (
        <EmptyState icon={FileText} title="No posts yet" description="Create your first post to start finding collaboration partners." action={<Button onClick={() => navigate('/create-post')}>Create Post</Button>} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {myPosts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </AppShell>
  );
};

export default MyPostsPage;
