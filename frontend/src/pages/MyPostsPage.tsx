import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { EmptyState, SectionHeader } from "@/components/SharedComponents";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import { useNavigate } from "react-router-dom";
import { FileText, Plus } from "lucide-react";

const MyPostsPage = () => {
  const { currentUser } = useAuth();
  const { posts } = usePlatformData();
  const navigate = useNavigate();

  if (!currentUser) {
    return null;
  }

  const myPosts = [...posts]
    .filter((post) => post.ownerId === currentUser.id)
    .sort(
      (leftPost, rightPost) =>
        new Date(rightPost.updatedAt).getTime() - new Date(leftPost.updatedAt).getTime(),
    );

  return (
    <AppShell>
      <SectionHeader
        title="My posts"
        description="Manage the high-level collaboration briefs attached to your profile."
        action={
          <Button size="sm" onClick={() => navigate("/create-post")}>
            <Plus className="mr-1 h-4 w-4" />
            New Post
          </Button>
        }
      />
      {myPosts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No posts yet"
          description="Create your first high-level post to start meeting potential collaborators."
          action={<Button onClick={() => navigate("/create-post")}>Create Post</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {myPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </AppShell>
  );
};

export default MyPostsPage;
