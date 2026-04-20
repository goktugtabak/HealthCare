import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/SharedComponents";
import { StatusBadge } from "@/components/StatusBadge";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import type { Notification, Post, Role } from "@/data/types";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AnimatedNumber = ({ value }: { value: number }) => {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { damping: 24, stiffness: 110 });
  const rounded = useTransform(spring, (latest) => Math.round(latest).toString());
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  useEffect(() => rounded.on("change", (latest) => setDisplay(latest)), [rounded]);

  return <>{display}</>;
};

interface DashboardPageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

interface DashboardStatItem {
  label: string;
  value: number | string;
  detail?: string;
  icon: LucideIcon;
}

interface DashboardStatsStripProps {
  items: DashboardStatItem[];
}

interface DashboardSectionHeadingProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const formatRoleLabel = (role: Role) => {
  if (role === "healthcare") {
    return "Healthcare Professional";
  }

  if (role === "engineer") {
    return "Engineer";
  }

  return "Admin";
};

const PostMetaItem = ({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary?: string;
}) => (
  <div>
    <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      {label}
    </dt>
    <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    {secondary && <p className="mt-1 text-xs text-muted-foreground">{secondary}</p>}
  </div>
);

export const DashboardPageHeader = ({
  eyebrow,
  title,
  description,
  action,
}: DashboardPageHeaderProps) => (
  <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
        {description}
      </p>
    </div>
    {action && <div className="flex shrink-0 items-center">{action}</div>}
  </div>
);

export const DashboardStatsStrip = ({ items }: DashboardStatsStripProps) => (
  <section className="relative overflow-hidden rounded-[28px] bg-card/70 px-5 py-5 ring-1 ring-border/60">
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-60"
      style={{
        background:
          "radial-gradient(60% 120% at 0% 0%, hsl(var(--accent) / 0.10), transparent 60%), radial-gradient(60% 120% at 100% 100%, hsl(var(--primary) / 0.10), transparent 60%)",
      }}
    />
    <div className="relative grid gap-5 md:grid-cols-2 xl:grid-cols-4 xl:gap-0 xl:divide-x xl:divide-border/60">
      {items.map((item, idx) => {
        const numericValue = typeof item.value === "number" ? item.value : null;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="group flex items-start justify-between gap-3 xl:px-5"
          >
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                {numericValue !== null ? <AnimatedNumber value={numericValue} /> : item.value}
              </p>
              {item.detail && (
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              )}
            </div>
            <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/20 text-accent transition-transform duration-300 group-hover:scale-110 group-hover:from-primary/20 group-hover:to-accent/30">
              <item.icon className="h-4 w-4" />
            </span>
          </motion.div>
        );
      })}
    </div>
  </section>
);

export const DashboardSurface = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <section className={cn("rounded-[28px] bg-card/80 ring-1 ring-border/60", className)}>
    {children}
  </section>
);

export const DashboardSectionHeading = ({
  title,
  description,
  action,
  className,
}: DashboardSectionHeadingProps) => (
  <div className={cn("flex items-start justify-between gap-4", className)}>
    <div>
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      )}
    </div>
    {action}
  </div>
);

export const DashboardPostPreview = ({ post }: { post: Post }) => {
  const navigate = useNavigate();
  const { users } = usePlatformData();
  const owner = users.find((user) => user.id === post.ownerId);

  return (
    <article className="-mx-2 rounded-3xl px-2 py-5 transition-colors hover:bg-muted/35">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {post.workingDomain}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold leading-7 text-foreground">
              {post.title}
            </h3>
            <StatusBadge status={post.status} className="border-transparent" />
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground line-clamp-2">
            {post.shortExplanation}
          </p>

          <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
            <PostMetaItem
              label="Location"
              value={`${post.city}, ${post.country}`}
            />
            <PostMetaItem label="Stage" value={post.projectStage} />
            <PostMetaItem
              label="Confidentiality"
              value={post.confidentialityLevel}
            />
            <PostMetaItem
              label="Owner"
              value={owner?.fullName ?? "Platform Member"}
              secondary={owner ? formatRoleLabel(owner.role) : undefined}
            />
          </dl>
        </div>

        <div className="flex shrink-0 items-center xl:pt-8">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full px-4"
            onClick={() => navigate(`/posts/${post.id}`)}
          >
            View Details
          </Button>
        </div>
      </div>
    </article>
  );
};

export const DashboardEmptyPosts = () => {
  const navigate = useNavigate();

  return (
    <EmptyState
      icon={Search}
      title="No relevant posts yet"
      description="Explore the broader feed to discover current collaboration opportunities."
      action={
        <Button variant="outline" onClick={() => navigate("/explore")}>
          Explore Posts
        </Button>
      }
    />
  );
};

export const CompactNotificationItem = ({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "w-full rounded-2xl px-3 py-3 text-left transition-colors hover:bg-muted/35",
      !notification.read && "bg-accent/5",
    )}
  >
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "mt-2 h-2 w-2 shrink-0 rounded-full",
          notification.read ? "bg-border" : "bg-accent",
        )}
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">
          {notification.title}
        </p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {new Date(notification.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  </button>
);

export const CompactPostItem = ({ post }: { post: Post }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="w-full rounded-2xl px-3 py-3 text-left transition-colors hover:bg-muted/35"
      onClick={() => navigate(`/posts/${post.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground line-clamp-1">
            {post.title}
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {post.workingDomain}
          </p>
        </div>
        <StatusBadge status={post.status} className="shrink-0 border-transparent" />
      </div>
    </button>
  );
};
