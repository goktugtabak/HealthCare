import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Compass,
  CalendarDays,
  LayoutDashboard,
  Shield,
  UserRound,
  FileText,
} from "lucide-react";
import type { Role } from "@/data/types";

export interface AppShellNavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: Role[];
}

const NAV_ITEMS: AppShellNavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["engineer", "healthcare", "admin"],
  },
  {
    label: "Explore",
    path: "/explore",
    icon: Compass,
    roles: ["engineer", "healthcare", "admin"],
  },
  {
    label: "My Posts",
    path: "/my-posts",
    icon: FileText,
    roles: ["engineer", "healthcare", "admin"],
  },
  {
    label: "Meetings",
    path: "/meetings",
    icon: CalendarDays,
    roles: ["engineer", "healthcare", "admin"],
  },
  {
    label: "Profile",
    path: "/profile",
    icon: UserRound,
    roles: ["engineer", "healthcare", "admin"],
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: Bell,
    roles: ["engineer", "healthcare", "admin"],
  },
  {
    label: "Admin",
    path: "/admin",
    icon: Shield,
    roles: ["admin"],
  },
];

export const getSidebarItems = (role: Role) =>
  NAV_ITEMS.filter((item) => item.roles.includes(role));

export const getRoleHomePath = (role: Role) =>
  role === "admin" ? "/admin" : "/dashboard";
