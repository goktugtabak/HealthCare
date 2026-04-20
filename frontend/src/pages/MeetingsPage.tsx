import { AppShell } from "@/components/AppShell";
import { SectionHeader } from "@/components/SharedComponents";
import { StatusBadge } from "@/components/StatusBadge";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import { toast } from "@/hooks/use-toast";
import { Calendar, CheckCircle, Mail, Phone, Share2, ShieldCheck, XCircle } from "lucide-react";

const MeetingsPage = () => {
  const { currentUser } = useAuth();
  const { acceptMeetingRequest, declineMeetingRequest, meetingRequests, posts, users } =
    usePlatformData();

  if (!currentUser) return null;

  const myPostIds = posts.filter((post) => post.ownerId === currentUser.id).map((post) => post.id);
  const incoming = [...meetingRequests]
    .filter((request) => myPostIds.includes(request.postId))
    .sort(
      (leftRequest, rightRequest) =>
        new Date(rightRequest.createdAt).getTime() - new Date(leftRequest.createdAt).getTime(),
    );
  const outgoing = [...meetingRequests]
    .filter((request) => request.requesterId === currentUser.id)
    .sort(
      (leftRequest, rightRequest) =>
        new Date(rightRequest.createdAt).getTime() - new Date(leftRequest.createdAt).getTime(),
    );

  const contactIcon = (method: string) => {
    if (method === "Phone") return Phone;
    if (method === "LinkedIn") return Share2;
    return Mail;
  };

  const RequestCard = ({
    request,
    type,
  }: {
    request: (typeof meetingRequests)[number];
    type: "incoming" | "outgoing";
  }) => {
    const post = posts.find((candidatePost) => candidatePost.id === request.postId);
    const requester = users.find((user) => user.id === request.requesterId);
    const owner = post ? users.find((user) => user.id === post.ownerId) : undefined;
    const handoffUser = type === "incoming" ? requester : owner;
    const ContactIcon = handoffUser?.preferredContact
      ? contactIcon(handoffUser.preferredContact.method)
      : Mail;

    return (
      <div className="rounded-[28px] border border-border bg-card p-5 animate-fade-in">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{post?.title}</p>
            <div className="mt-1 flex items-center gap-2">
              {requester && (
                <span className="text-xs text-muted-foreground">
                  {type === "incoming" ? "From:" : "Requested by"} {requester.fullName}
                </span>
              )}
              {requester && <RoleBadge role={requester.role} showIcon={false} />}
            </div>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <p className="mb-3 text-sm leading-6 text-muted-foreground">
          {request.introductoryMessage}
        </p>

        <div className="mb-3">
          <p className="mb-1 text-xs font-medium">Proposed slots</p>
          <div className="flex flex-wrap gap-2">
            {request.proposedSlots.map((slot) => (
              <span
                key={slot}
                className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${
                  request.selectedSlot === slot
                    ? "border-success/20 bg-success/10 text-success"
                    : "border-border text-muted-foreground"
                }`}
              >
                <Calendar className="h-3 w-3" />
                {new Date(slot).toLocaleString()}
              </span>
            ))}
          </div>
        </div>

        {type === "incoming" && request.status === "Pending" && (
          <div className="flex flex-wrap gap-2">
            {request.proposedSlots.map((slot) => (
              <Button
                key={slot}
                size="sm"
                variant="outline"
                onClick={() => {
                  acceptMeetingRequest(request.id, slot);
                  toast({
                    title: "Meeting scheduled",
                    description: `First meeting confirmed for ${new Date(slot).toLocaleString()}.`,
                  });
                }}
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Accept {new Date(slot).toLocaleDateString()}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                declineMeetingRequest(request.id);
                toast({ title: "Request declined" });
              }}
            >
              <XCircle className="mr-1 h-3 w-3" />
              Decline
            </Button>
          </div>
        )}

        {request.status === "Scheduled" && handoffUser?.preferredContact && (
          <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Continue off-platform</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The introduction is scheduled. Detailed discussion, files, and follow-up are now
                  the responsibility of both parties.
                </p>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <ContactIcon className="h-4 w-4 text-primary" />
                  <span className="font-medium">{handoffUser.preferredContact.method}:</span>
                  <span className="truncate text-muted-foreground">
                    {handoffUser.preferredContact.value}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <AppShell>
      <SectionHeader
        title="Meetings"
        description="Manage intro requests, confirm the first slot, and hand off detailed discussion to external channels."
      />

      {incoming.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-3 text-base font-semibold">Incoming requests</h3>
          <div className="space-y-3">
            {incoming.map((request) => (
              <RequestCard key={request.id} request={request} type="incoming" />
            ))}
          </div>
        </div>
      )}

      {outgoing.length > 0 && (
        <div>
          <h3 className="mb-3 text-base font-semibold">My requests</h3>
          <div className="space-y-3">
            {outgoing.map((request) => (
              <RequestCard key={request.id} request={request} type="outgoing" />
            ))}
          </div>
        </div>
      )}

      {incoming.length === 0 && outgoing.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No meeting requests yet.
        </div>
      )}
    </AppShell>
  );
};

export default MeetingsPage;
