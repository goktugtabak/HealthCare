import { Button } from "@/components/ui/button";
import { getRoleHomePath } from "@/components/app-shell-nav";
import type { Role, User } from "@/data/types";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TopNavProps {
  user: User;
  unreadCount?: number;
  isMobileMenuOpen?: boolean;
  onMenuToggle?: () => void;
  onLogout?: () => void;
}

const getInitials = (fullName: string) =>
  fullName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getRoleLabel = (role: Role) => {
  if (role === "healthcare") {
    return "Healthcare Professional";
  }

  if (role === "engineer") {
    return "Engineer";
  }

  return "Admin";
};

export const TopNav = ({
  user,
  unreadCount = 0,
  isMobileMenuOpen = false,
  onMenuToggle,
  onLogout,
}: TopNavProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground lg:hidden"
          onClick={onMenuToggle}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        <button
          type="button"
          className="flex items-center gap-3 text-left"
          onClick={() => navigate(getRoleHomePath(user.role))}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
            HA
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-foreground">
              HEALTH AI Co-Creation Platform
            </p>
            <p className="text-xs text-muted-foreground">
              Cross-disciplinary healthcare innovation
            </p>
          </div>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground"
            aria-label="Open notifications"
            onClick={() => navigate("/notifications")}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          <div className="hidden items-center gap-3 pl-2 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
              {getInitials(user.fullName)}
            </div>
            <div className="pr-1 leading-tight">
              <p className="text-sm font-medium text-foreground">
                {user.fullName}
              </p>
              <p className="text-xs text-muted-foreground">
                {getRoleLabel(user.role)}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            aria-label="Log out"
            onClick={onLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
