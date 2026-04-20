import { StatusBadge } from "./StatusBadge";
import { RoleBadge } from "./RoleBadge";
import {
  MapPin,
  Calendar,
  Lock,
  Eye,
  Sparkles,
  ArrowRight,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import { cn } from "@/lib/utils";
import type { Post } from "@/data/types";

interface PostCardProps {
  post: Post;
  highlightLabel?: string;
  matchCount?: number;
  matchedTags?: string[];
  ownerMode?: boolean;
}

export const PostCard = ({
  post,
  highlightLabel,
  matchCount,
  matchedTags,
  ownerMode = false,
}: PostCardProps) => {
  const navigate = useNavigate();
  const { users } = usePlatformData();
  const owner = users.find((user) => user.id === post.ownerId);

  const totalTags = post.requiredExpertise.length + post.matchTags.length;
  const relevanceScore =
    typeof matchCount === "number" && totalTags > 0
      ? Math.min(100, Math.round((matchCount / Math.max(totalTags, 3)) * 100))
      : null;
  const matchedTagSet = new Set((matchedTags ?? []).map((tag) => tag.toLowerCase()));

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[24px] border border-border bg-card p-5 transition-all animate-fade-in",
        "hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5",
      )}
    >
      {relevanceScore !== null && relevanceScore > 0 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-primary to-accent opacity-80"
          style={{ width: `${relevanceScore}%` }}
        />
      )}

      {highlightLabel && (
        <div className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-gradient-to-r from-accent/15 to-primary/15 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3 w-3" />
          {highlightLabel}
          {relevanceScore !== null && relevanceScore > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
              {relevanceScore}%
            </span>
          )}
        </div>
      )}

      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-card-foreground">
            {post.title}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{post.workingDomain}</p>
        </div>
        <StatusBadge status={post.status} />
      </div>

      <p className="mb-3 text-sm leading-6 text-muted-foreground line-clamp-3">
        {post.shortExplanation}
      </p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {post.requiredExpertise.slice(0, 3).map((tag) => {
          const isMatched = matchedTagSet.has(tag.toLowerCase());
          return (
            <span
              key={tag}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs transition-colors",
                isMatched
                  ? "bg-accent/15 font-medium text-accent ring-1 ring-accent/30"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {tag}
            </span>
          );
        })}
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

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-4">
        <div className="min-w-0">
          {ownerMode ? (
            <p className="text-xs text-muted-foreground">
              Updated {new Date(post.updatedAt).toLocaleDateString()}
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {owner && <RoleBadge role={owner.role} showIcon={false} />}
                <span className="truncate text-xs text-muted-foreground">
                  {owner?.fullName}
                </span>
              </div>
              {owner && (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {owner.institution}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {ownerMode && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => navigate(`/posts/${post.id}/edit`)}
            >
              <Pencil className="mr-1 h-3.5 w-3.5" />
              Edit
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="rounded-full group-hover:border-accent group-hover:text-accent"
            onClick={() => navigate(`/posts/${post.id}`)}
          >
            {ownerMode ? "Open" : "View"}
            <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </article>
  );
};
