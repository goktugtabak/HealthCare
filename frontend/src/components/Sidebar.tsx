import { MessageCircle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { RoleBadge } from "@/components/RoleBadge";
import { getSidebarItems } from "@/components/app-shell-nav";
import { useAuth } from "@/contexts/AuthContext";
import { useChatDock } from "@/contexts/ChatDockContext";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import type { Role } from "@/data/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: Role;
  className?: string;
  onNavigate?: () => void;
}

export const Sidebar = ({ role, className, onNavigate }: SidebarProps) => {
  const items = getSidebarItems(role);
  const { openDock } = useChatDock();
  const { currentUser } = useAuth();
  const { messages } = usePlatformData();

  const unreadMessages = currentUser
    ? messages.filter(
        (message) =>
          message.recipientId === currentUser.id && !message.readAt,
      ).length
    : 0;

  const handleMessagesClick = () => {
    openDock();
    onNavigate?.();
  };

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
          <button
            type="button"
            onClick={handleMessagesClick}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Messages</span>
            {unreadMessages > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
};
