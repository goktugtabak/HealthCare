import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, FileText, Search, Bell, User, LogOut, Menu, X,
  Users, BarChart3, ScrollText, Settings
} from 'lucide-react';
import { mockNotifications } from '@/data/mockData';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = {
  engineer: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Explore Posts', path: '/explore', icon: Search },
    { label: 'My Posts', path: '/my-posts', icon: FileText },
    { label: 'Meetings', path: '/meetings', icon: Settings },
    { label: 'Profile', path: '/profile', icon: User },
  ],
  healthcare: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Explore Posts', path: '/explore', icon: Search },
    { label: 'My Posts', path: '/my-posts', icon: FileText },
    { label: 'Meetings', path: '/meetings', icon: Settings },
    { label: 'Profile', path: '/profile', icon: User },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Posts', path: '/admin/posts', icon: FileText },
    { label: 'Activity Logs', path: '/admin/logs', icon: ScrollText },
    { label: 'Statistics', path: '/admin/stats', icon: BarChart3 },
  ],
};

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!currentUser) return null;

  const items = navItems[currentUser.role];
  const unreadCount = mockNotifications.filter(n => n.userId === currentUser.id && !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex h-14 items-center px-4 md:px-6">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="mr-3 md:hidden">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="text-base font-semibold cursor-pointer" onClick={() => navigate('/dashboard')}>
            Health AI
          </span>

          <nav className="hidden md:flex items-center gap-1 ml-8">
            {items.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                  location.pathname === item.path
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => navigate('/notifications')} className="relative rounded-md p-2 hover:bg-muted transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="hidden sm:flex items-center gap-2 ml-2">
              <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground font-medium">
                {currentUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <span className="text-sm font-medium">{currentUser.fullName}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/'); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-14 z-30 bg-background/95 md:hidden animate-fade-in">
          <nav className="flex flex-col p-4 gap-1">
            {items.map(item => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors',
                  location.pathname === item.path
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 md:px-6 py-6">{children}</main>
    </div>
  );
};
