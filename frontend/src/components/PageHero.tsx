import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export const PageHero = ({
  eyebrow,
  title,
  description,
  icon: Icon,
  action,
  meta,
  className,
}: PageHeroProps) => (
  <section
    className={cn(
      "relative mb-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-primary/[0.04] via-card/90 to-accent/[0.06] p-6 ring-1 ring-border/60 sm:p-8",
      className,
    )}
  >
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-60"
      style={{
        background:
          "radial-gradient(50% 100% at 0% 0%, hsl(var(--accent) / 0.10), transparent 60%), radial-gradient(50% 100% at 100% 100%, hsl(var(--primary) / 0.10), transparent 60%)",
      }}
    />
    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <div className="mt-2 flex items-center gap-3">
          {Icon && (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/20 text-accent">
              <Icon className="h-5 w-5" />
            </span>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
        </div>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
        {meta && <div className="mt-4">{meta}</div>}
      </div>
      {action && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>
      )}
    </div>
  </section>
);
