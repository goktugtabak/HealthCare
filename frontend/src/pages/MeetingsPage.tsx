import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { SectionHeader } from '@/components/SharedComponents';
import { StatusBadge } from '@/components/StatusBadge';
import { RoleBadge } from '@/components/RoleBadge';
import { Button } from '@/components/ui/button';
import { mockMeetingRequests, mockPosts, mockUsers } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';

const MeetingsPage = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState(mockMeetingRequests);

  if (!currentUser) return null;

  // Show incoming requests for posts I own + outgoing requests I made
  const myPostIds = mockPosts.filter(p => p.ownerId === currentUser.id).map(p => p.id);
  const incoming = requests.filter(r => myPostIds.includes(r.postId));
  const outgoing = requests.filter(r => r.requesterId === currentUser.id);

  const handleAccept = (id: string, slot: string) => {
    setRequests(rs => rs.map(r => r.id === id ? { ...r, status: 'Scheduled', selectedSlot: slot } : r));
    toast({ title: 'Meeting scheduled', description: `Meeting confirmed for ${new Date(slot).toLocaleString()}` });
  };

  const handleDecline = (id: string) => {
    setRequests(rs => rs.map(r => r.id === id ? { ...r, status: 'Declined' } : r));
    toast({ title: 'Request declined' });
  };

  const RequestCard = ({ request, type }: { request: typeof requests[0]; type: 'incoming' | 'outgoing' }) => {
    const post = mockPosts.find(p => p.id === request.postId);
    const requester = mockUsers.find(u => u.id === request.requesterId);

    return (
      <div className="rounded-lg border border-border bg-card p-5 animate-fade-in">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-sm font-semibold">{post?.title}</p>
            <div className="flex items-center gap-2 mt-1">
              {requester && <span className="text-xs text-muted-foreground">{type === 'incoming' ? 'From:' : 'Your request'} {requester.fullName}</span>}
              {requester && <RoleBadge role={requester.role} showIcon={false} />}
            </div>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{request.introductoryMessage}</p>

        <div className="mb-3">
          <p className="text-xs font-medium mb-1">Proposed Slots:</p>
          <div className="flex flex-wrap gap-2">
            {request.proposedSlots.map(slot => (
              <span key={slot} className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${request.selectedSlot === slot ? 'bg-success/10 border-success/20 text-success' : 'border-border text-muted-foreground'}`}>
                <Calendar className="h-3 w-3" />
                {new Date(slot).toLocaleString()}
                {request.selectedSlot === slot && ' ✓'}
              </span>
            ))}
          </div>
        </div>

        {type === 'incoming' && request.status === 'Pending' && (
          <div className="flex gap-2">
            {request.proposedSlots.map(slot => (
              <Button key={slot} size="sm" variant="outline" onClick={() => handleAccept(request.id, slot)}>
                <CheckCircle className="h-3 w-3 mr-1" /> Accept {new Date(slot).toLocaleDateString()}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => handleDecline(request.id)}>
              <XCircle className="h-3 w-3 mr-1" /> Decline
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <AppShell>
      <SectionHeader title="Meetings" description="Manage meeting requests and scheduled meetings." />

      {incoming.length > 0 && (
        <div className="mb-8">
          <h3 className="text-base font-semibold mb-3">Incoming Requests</h3>
          <div className="space-y-3">
            {incoming.map(r => <RequestCard key={r.id} request={r} type="incoming" />)}
          </div>
        </div>
      )}

      {outgoing.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3">My Requests</h3>
          <div className="space-y-3">
            {outgoing.map(r => <RequestCard key={r.id} request={r} type="outgoing" />)}
          </div>
        </div>
      )}

      {incoming.length === 0 && outgoing.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">No meeting requests yet.</div>
      )}
    </AppShell>
  );
};

export default MeetingsPage;
