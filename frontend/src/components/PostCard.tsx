import { Post } from '@/data/types';
import { StatusBadge } from './StatusBadge';
import { RoleBadge } from './RoleBadge';
import { MapPin, Calendar, Lock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { mockUsers } from '@/data/mockData';

export const PostCard = ({ post }: { post: Post }) => {
  const navigate = useNavigate();
  const owner = mockUsers.find(u => u.id === post.ownerId);

  return (
    <div className="group rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-card-foreground truncate">{post.title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{post.workingDomain}</p>
        </div>
        <StatusBadge status={post.status} />
      </div>

      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.shortExplanation}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {post.requiredExpertise.slice(0, 3).map(tag => (
          <span key={tag} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{tag}</span>
        ))}
        {post.requiredExpertise.length > 3 && (
          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">+{post.requiredExpertise.length - 3}</span>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{post.city}, {post.country}</span>
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{post.projectStage}</span>
        <span className="flex items-center gap-1">
          {post.confidentialityLevel === 'Public' ? <Eye className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
          {post.confidentialityLevel}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {owner && <RoleBadge role={owner.role} showIcon={false} />}
          <span className="text-xs text-muted-foreground">{owner?.fullName}</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/posts/${post.id}`)}>
          View Details
        </Button>
      </div>
    </div>
  );
};
