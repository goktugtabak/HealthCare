import { PostStatus, MeetingRequestStatus } from '@/data/types';
import { cn } from '@/lib/utils';

const postStatusStyles: Record<PostStatus, string> = {
  Draft: 'bg-muted text-muted-foreground border-border',
  Active: 'bg-info/10 text-info border-info/20',
  'Meeting Scheduled': 'bg-warning/10 text-warning border-warning/20',
  'Partner Found': 'bg-success/10 text-success border-success/20',
  Expired: 'bg-destructive/10 text-destructive border-destructive/20',
};

const meetingStatusStyles: Record<MeetingRequestStatus, string> = {
  Pending: 'bg-warning/10 text-warning border-warning/20',
  Accepted: 'bg-success/10 text-success border-success/20',
  Declined: 'bg-destructive/10 text-destructive border-destructive/20',
  Scheduled: 'bg-info/10 text-info border-info/20',
  Cancelled: 'bg-muted text-muted-foreground border-border',
  Completed: 'bg-success/10 text-success border-success/20',
};

export const StatusBadge = ({ status, className }: { status: PostStatus | MeetingRequestStatus; className?: string }) => {
  const styles = (postStatusStyles as any)[status] || (meetingStatusStyles as any)[status] || 'bg-muted text-muted-foreground';
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', styles, className)}>
      {status}
    </span>
  );
};
