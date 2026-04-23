import { MessageCircle, ChevronLeft, ChevronRight, Shield, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { getSidebarItems } from "@/components/app-shell-nav";
import { useAuth } from "@/contexts/AuthContext";
import { useChatDock } from "@/contexts/ChatDockContext";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import type { Role } from "@/data/types";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  role: Role;
  className?: string;
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const getInitials = (fullName: string) =>
  fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getRoleLabel = (role: Role) => {
  if (role === "healthcare") return "Healthcare";
  if (role === "engineer") return "Engineer";
  return "Admin";
};

const WORKSPACE_PATHS = ["/dashboard", "/explore", "/my-posts", "/meetings"];
const ACCOUNT_PATHS = ["/profile", "/notifications", "/admin"];

export const Sidebar = ({
  role,
  className,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) => {
  const allItems = getSidebarItems(role);
  const workspaceItems = allItems.filter((item) => WORKSPACE_PATHS.includes(item.path));
  const accountItems = allItems.filter((item) => ACCOUNT_PATHS.includes(item.path));

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

  const NavItem = ({
    icon: Icon,
    label,
    path,
    badge,
    onClick,
    isButton = false,
  }: {
    icon: React.ElementType;
    label: string;
    path?: string;
    badge?: number;
    onClick?: () => void;
    isButton?: boolean;
  }) => {
    const content = (
      <span
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
          "text-[hsl(var(--sidebar-foreground)/0.7)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]",
          collapsed && "justify-center px-2",
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{label}</span>
            {badge != null && badge > 0 && (
              <span className="rounded-full bg-[hsl(var(--sidebar-primary))] px-2 py-0.5 text-[10px] font-semibold text-white">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </>
        )}
      </span>
    );

    const wrapped = collapsed ? (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {label}
          {badge != null && badge > 0 && (
            <span className="rounded-full bg-[hsl(var(--sidebar-primary))] px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    ) : (
      content
    );

    if (isButton || !path) {
      return (
        <button type="button" onClick={onClick} className="w-full text-left">
          {wrapped}
        </button>
      );
    }

    return (
      <NavLink
        to={path}
        end={path !== "/admin"}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
          "text-[hsl(var(--sidebar-foreground)/0.7)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]",
          collapsed && "justify-center px-2",
        )}
        activeClassName="!bg-[hsl(var(--sidebar-primary)/0.15)] !text-[hsl(var(--sidebar-primary))] border-l-2 border-[hsl(var(--sidebar-primary))] rounded-l-none"
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex justify-center">
                <Icon className="h-[18px] w-[18px] shrink-0" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="right">
              {label}
            </TooltipContent>
          </Tooltip>
        ) : (
          <>
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {badge != null && badge > 0 && (
              <span className="rounded-full bg-[hsl(var(--sidebar-primary))] px-2 py-0.5 text-[10px] font-semibold text-white">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <div
      className={cn(
        "relative flex h-full flex-col bg-[hsl(var(--sidebar-background))] transition-all duration-300",
        className,
      )}
    >
      {/* Logo area */}
      <div
        className={cn(
          "flex items-center border-b border-[hsl(var(--sidebar-border))] px-4 py-5",
          collapsed ? "justify-center px-2" : "gap-3",
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--sidebar-primary))] text-sm font-bold text-white">
          HA
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[hsl(var(--sidebar-foreground))]">
              HEALTH AI
            </p>
            <p className="truncate text-[11px] text-[hsl(var(--sidebar-foreground)/0.5)]">
              Co-Creation Platform
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {/* Workspace section */}
        {!collapsed && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--sidebar-foreground)/0.4)]">
            Workspace
          </p>
        )}
        <div className="space-y-0.5 mb-6">
          {workspaceItems.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
            />
          ))}
          <NavItem
            icon={MessageCircle}
            label="Messages"
            badge={unreadMessages}
            onClick={handleMessagesClick}
            isButton
          />
        </div>

        {/* Account section */}
        {!collapsed && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--sidebar-foreground)/0.4)]">
            Account
          </p>
        )}
        {collapsed && (
          <div className="my-3 border-t border-[hsl(var(--sidebar-border))]" />
        )}
        <div className="space-y-0.5">
          {accountItems.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
            />
          ))}
          <NavItem
            icon={Settings}
            label="Settings"
            path="/profile"
            onClick={onNavigate}
          />
        </div>
      </nav>

      {/* User card */}
      {currentUser && (
        <div className={cn(
          "border-t border-[hsl(var(--sidebar-border))] p-3",
          collapsed ? "flex justify-center" : "",
        )}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex h-9 w-9 cursor-default items-center justify-center rounded-full bg-[hsl(var(--sidebar-primary)/0.25)] text-xs font-semibold text-[hsl(var(--sidebar-primary))]">
                  {getInitials(currentUser.fullName)}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-medium">{currentUser.fullName}</p>
                <p className="text-xs opacity-70">{getRoleLabel(currentUser.role)}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-[hsl(var(--sidebar-accent))] px-3 py-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--sidebar-primary)/0.25)] text-xs font-semibold text-[hsl(var(--sidebar-primary))]">
                {getInitials(currentUser.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[hsl(var(--sidebar-foreground))]">
                  {currentUser.fullName}
                </p>
                <p className="truncate text-[11px] text-[hsl(var(--sidebar-foreground)/0.5)]">
                  {getRoleLabel(currentUser.role)}
                  {currentUser.institution ? ` · ${currentUser.institution}` : ""}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapse toggle button */}
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "absolute -right-3 top-[72px] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground)/0.6)] shadow-md transition-colors hover:text-[hsl(var(--sidebar-foreground))]",
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
};
