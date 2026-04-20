import { StatusBadge } from "./StatusBadge";
import { RoleBadge } from "./RoleBadge";
import { MapPin, Calendar, Lock, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import type { Post } from "@/data/types";

export const PostCard = ({
  post,
  highlightLabel,
}: {
  post: Post;
  highlightLabel?: string;
}) => {
  const navigate = useNavigate();
  const { users } = usePlatformData();
  const owner = users.find((user) => user.id === post.ownerId);

  return (
    <article className="group rounded-[24px] border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md animate-fade-in">
      {highlightLabel && (
        <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3 w-3" />
          {highlightLabel}
        </div>
      )}

      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-card-foreground">{post.title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{post.workingDomain}</p>
        </div>
        <StatusBadge status={post.status} />
      </div>

      <p className="mb-3 text-sm leading-6 text-muted-foreground line-clamp-3">
        {post.shortExplanation}
      </p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {post.requiredExpertise.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
          >
            {tag}
          </span>
        ))}
        {post.requiredExpertise.length > 3 && (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
            +{post.requiredExpertise.length - 3}
          </span>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {post.city}, {post.country}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
        <span className="flex items-center gap-1">
          {post.confidentialityLevel === "Public" ? (
            <Eye className="h-3 w-3" />
          ) : (
            <Lock className="h-3 w-3" />
          )}
          {post.confidentialityLevel}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {owner && <RoleBadge role={owner.role} showIcon={false} />}
            <span className="truncate text-xs text-muted-foreground">{owner?.fullName}</span>
          </div>
          {owner && (
            <p className="mt-1 truncate text-xs text-muted-foreground">{owner.institution}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/posts/${post.id}`)}>
          View Details
        </Button>
      </div>
    </article>
  );
};
