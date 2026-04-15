import { Role } from '@/data/types';
import { cn } from '@/lib/utils';
import { Stethoscope, Cpu, Shield } from 'lucide-react';

const roleConfig: Record<Role, { label: string; className: string; icon: React.ElementType }> = {
  engineer: { label: 'Engineer', className: 'bg-info/10 text-info border-info/20', icon: Cpu },
  healthcare: { label: 'Healthcare Professional', className: 'bg-accent/10 text-accent border-accent/20', icon: Stethoscope },
  admin: { label: 'Admin', className: 'bg-muted text-muted-foreground border-border', icon: Shield },
};

export const RoleBadge = ({ role, showIcon = true, className }: { role: Role; showIcon?: boolean; className?: string }) => {
  const config = roleConfig[role];
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', config.className, className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </span>
  );
};
