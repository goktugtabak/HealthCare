import { ChevronLeft, ChevronRight, Settings, Activity, ChevronsUpDown } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { getSidebarItems } from "@/components/app-shell-nav";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import type { Role } from "@/data/types";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  if (role === "healthcare") return "Healthcare Professional";
  if (role === "engineer") return "AI Engineer";
  return "Administrator";
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

  const { currentUser } = useAuth();
  const { notifications } = usePlatformData();

  const unreadNotifications = currentUser
    ? notifications.filter((n) => n.userId === currentUser.id && !n.read).length
    : 0;

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
          "flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-all duration-200",
          "text-muted-foreground/80 hover:bg-muted/80 hover:text-foreground",
          collapsed && "justify-center px-2",
        )}
      >
        <Icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-[18px] w-[18px]")} />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{label}</span>
            {badge != null && badge > 0 && (
              <span className="flex h-5 items-center justify-center rounded-full bg-primary px-2 text-[10px] font-bold text-primary-foreground shadow-sm">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </>
        )}
      </span>
    );

    const wrapped = collapsed ? (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2 font-medium">
          {label}
          {badge != null && badge > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
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
        <button type="button" onClick={onClick} className="w-full text-left focus:outline-none">
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
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-all duration-200",
          "text-muted-foreground hover:bg-muted/60 hover:text-foreground focus:outline-none",
          collapsed && "justify-center px-2",
        )}
        activeClassName="!bg-primary/10 !text-primary shadow-sm ring-1 ring-primary/20 !font-semibold"
      >
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <span className="flex justify-center">
                <Icon className="h-5 w-5 shrink-0" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {label}
            </TooltipContent>
          </Tooltip>
        ) : (
          <>
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {badge != null && badge > 0 && (
              <span className="flex h-5 items-center justify-center rounded-full bg-primary px-2 text-[10px] font-bold text-primary-foreground shadow-sm">
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
        "relative flex h-full flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 border-r border-border/40",
        className,
      )}
    >
      {/* Logo area */}
      <div
        className={cn(
          "flex items-center pt-8 pb-6 px-6",
          collapsed ? "justify-center px-2" : "gap-3",
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-primary/80 text-white shadow-md shadow-primary/20">
          <Activity className="h-5 w-5" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold tracking-tight text-foreground">
              HEALTH AI
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 no-scrollbar">
        {/* Workspace section */}
        <div className="mb-8">
          {!collapsed && (
            <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50">
              Workspace
            </p>
          )}
          <div className="space-y-1">
            {workspaceItems.map((item) => (
              <NavItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                path={item.path}
              />
            ))}
          </div>
        </div>

        {/* Account section */}
        <div>
          {!collapsed && (
            <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50">
              Account
            </p>
          )}
          {collapsed && (
            <div className="my-4 mx-3 border-t border-border/50" />
          )}
          <div className="space-y-1">
            {accountItems.map((item) => (
              <NavItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                path={item.path}
                badge={item.path === "/notifications" ? unreadNotifications : undefined}
              />
            ))}
            <NavItem
              icon={Settings}
              label="Settings"
              path="/profile"
              onClick={onNavigate}
            />
          </div>
        </div>
      </nav>

      {/* User card */}
      {currentUser && (
        <div className={cn(
          "p-4 border-t border-border/40 bg-muted/10",
          collapsed ? "flex justify-center" : "",
        )}>
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="cursor-pointer">
                  <Avatar className="h-9 w-9 border border-primary/10 shadow-sm transition-opacity hover:opacity-80">
                    <AvatarImage src={currentUser.avatar || undefined} />
                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold">
                      {getInitials(currentUser.fullName)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                <p>{currentUser.fullName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{getRoleLabel(currentUser.role)}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60 cursor-pointer">
              <Avatar className="h-10 w-10 border border-primary/10 shadow-sm shrink-0">
                <AvatarImage src={currentUser.avatar || undefined} />
                <AvatarFallback className="bg-primary/5 text-primary text-sm font-semibold">
                  {getInitials(currentUser.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground/90 group-hover:text-foreground transition-colors">
                  {currentUser.fullName}
                </p>
                <p className="truncate text-[11px] font-medium text-muted-foreground/80 mt-0.5">
                  {getRoleLabel(currentUser.role)}
                </p>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground transition-colors" />
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
            "absolute -right-3 top-9 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground shadow-sm transition-all hover:text-foreground hover:scale-110 hover:border-border focus:outline-none",
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
