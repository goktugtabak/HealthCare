import { lazy, Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { User } from "@/data/types";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Compass,
  FileText,
  Plus,
  Sparkles,
  UserCircle2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const SubtleScene = lazy(() => import("@/components/three/SubtleScene"));

export interface NextBestAction {
  headline: string;
  description: string;
  ctaLabel: string;
  to: string;
  icon: LucideIcon;
  tone: "primary" | "accent" | "success";
}

export interface OnboardingStep {
  id: string;
  label: string;
  done: boolean;
  to: string;
  icon: LucideIcon;
}

interface DashboardHeroProps {
  user: User;
  eyebrow: string;
  nextAction: NextBestAction;
  steps: OnboardingStep[];
}

const STORAGE_KEY = "dashboard.onboarding.dismissed";

const toneStyles: Record<NextBestAction["tone"], string> = {
  primary:
    "bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground",
  accent:
    "bg-gradient-to-br from-accent via-accent to-accent/80 text-accent-foreground",
  success:
    "bg-gradient-to-br from-[hsl(var(--success))] to-[hsl(var(--success))]/80 text-[hsl(var(--success-foreground))]",
};

export const DashboardHero = ({
  user,
  eyebrow,
  nextAction,
  steps,
}: DashboardHeroProps) => {
  const navigate = useNavigate();
  const firstName = user.fullName.split(" ")[0];
  const completedCount = steps.filter((step) => step.done).length;
  const allDone = completedCount === steps.length;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  const showChecklist = !allDone && !dismissed;
  const Icon = nextAction.icon;

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-primary/[0.04] via-card/90 to-accent/[0.06] ring-1 ring-border/60">
      <Suspense fallback={null}>
        <SubtleScene
          intensity="minimal"
          className="pointer-events-none absolute inset-0 -z-0 opacity-70"
        />
      </Suspense>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/85 via-background/50 to-background/20"
      />

      <div className="relative z-10 flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-stretch lg:p-10">
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Here is what needs your attention right now — one clear next step,
              with everything else a glance away.
            </p>
          </div>

          <motion.button
            type="button"
            onClick={() => navigate(nextAction.to)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              "group relative w-full max-w-xl overflow-hidden rounded-2xl p-5 text-left shadow-lg shadow-primary/10 transition-shadow hover:shadow-xl hover:shadow-primary/20",
              toneStyles[nextAction.tone],
            )}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl transition-transform duration-500 group-hover:scale-125"
            />
            <div className="relative flex items-start gap-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-80">
                  Next best action
                </p>
                <p className="mt-1 text-lg font-semibold leading-snug">
                  {nextAction.headline}
                </p>
                <p className="mt-1 text-sm leading-5 opacity-90">
                  {nextAction.description}
                </p>
              </div>
              <span className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur transition-transform group-hover:translate-x-1">
                {nextAction.ctaLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </motion.button>
        </div>

        {showChecklist && (
          <motion.aside
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full shrink-0 rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur-sm lg:w-80"
          >
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss checklist"
              className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <p className="text-sm font-semibold text-foreground">
                Get started in 3 steps
              </p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {completedCount} of {steps.length} complete
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(completedCount / steps.length) * 100}%`,
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
              />
            </div>
            <ul className="mt-4 space-y-2">
              {steps.map((step) => {
                const StepIcon = step.icon;
                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      onClick={() => navigate(step.to)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                        step.done
                          ? "bg-muted/50 text-muted-foreground"
                          : "hover:bg-muted/60",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                          step.done
                            ? "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]"
                            : "bg-accent/15 text-accent",
                        )}
                      >
                        {step.done ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <StepIcon className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <span
                        className={cn(
                          "flex-1 font-medium",
                          step.done && "line-through",
                        )}
                      >
                        {step.label}
                      </span>
                      {!step.done && (
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.aside>
        )}

        {allDone && !dismissed && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative flex w-full shrink-0 flex-col justify-center gap-3 rounded-2xl border border-[hsl(var(--success))]/25 bg-[hsl(var(--success))]/10 p-5 lg:w-80"
          >
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss"
              className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <CheckCircle2 className="h-6 w-6 text-[hsl(var(--success))]" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                You are all set
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Profile complete. Keep exploring or publish your next post.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-fit rounded-full"
              onClick={() => navigate("/explore")}
            >
              <Compass className="mr-1 h-3.5 w-3.5" />
              Explore
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export const buildOnboardingSteps = (
  user: User,
  hasPosts: boolean,
  hasActivity: boolean,
): OnboardingStep[] => [
  {
    id: "profile",
    label: "Complete your profile",
    done: user.profileCompleteness >= 80,
    to: "/profile",
    icon: UserCircle2,
  },
  {
    id: "first-step",
    label:
      user.role === "engineer"
        ? "Publish your first post"
        : "Explore your first match",
    done: user.role === "engineer" ? hasPosts : hasActivity,
    to: user.role === "engineer" ? "/create-post" : "/explore",
    icon: user.role === "engineer" ? Plus : Compass,
  },
  {
    id: "engage",
    label: "Review or send a meeting request",
    done: hasActivity,
    to: "/meetings",
    icon: FileText,
  },
];
