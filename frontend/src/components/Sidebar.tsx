import { NavLink } from "@/components/NavLink";
import { RoleBadge } from "@/components/RoleBadge";
import { getSidebarItems } from "@/components/app-shell-nav";
import type { Role } from "@/data/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: Role;
  className?: string;
  onNavigate?: () => void;
}

export const Sidebar = ({ role, className, onNavigate }: SidebarProps) => {
  const items = getSidebarItems(role);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="border-b border-border/70 px-5 py-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Workspace
        </p>
        <h2 className="mt-2 text-base font-semibold text-foreground">
          Main Navigation
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform overview and collaboration tools.
        </p>
        <RoleBadge
          role={role}
          className="mt-4 border-transparent bg-muted text-muted-foreground"
        />
      </div>

      <nav className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path !== "/admin"}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              activeClassName="bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};
