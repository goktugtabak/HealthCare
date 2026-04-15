import { cn } from '@/lib/utils';

export const SectionHeader = ({ title, description, className, action }: {
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
}) => (
  <div className={cn('flex items-start justify-between gap-4 mb-6', className)}>
    <div>
      <h2 className="text-xl font-semibold">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
    {action}
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="rounded-full bg-muted p-4 mb-4">
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-medium mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
    {action}
  </div>
);

export const StatsCard = ({ label, value, icon: Icon, trend }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
}) => (
  <div className="rounded-lg border border-border bg-card p-5">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <div className="text-2xl font-semibold">{value}</div>
    {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
  </div>
);

export const NotificationItem = ({ title, message, time, read, onClick }: {
  title: string;
  message: string;
  time: string;
  read: boolean;
  onClick?: () => void;
}) => (
  <button onClick={onClick} className={cn('w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/50', !read && 'bg-info/5 border border-info/10')}>
    <div className="flex items-start gap-2">
      {!read && <div className="mt-1.5 h-2 w-2 rounded-full bg-info flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{message}</p>
        <p className="text-xs text-muted-foreground mt-1">{time}</p>
      </div>
    </div>
  </button>
);
