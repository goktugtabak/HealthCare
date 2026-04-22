import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { EmptyState } from "@/components/SharedComponents";
import { StatusBadge } from "@/components/StatusBadge";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CalendarClock,
  CheckCircle,
  Inbox,
  Mail,
  Phone,
  Send,
  Share2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { MeetingRequest } from "@/data/types";

type Direction = "incoming" | "outgoing";
type StatusFilter = "all" | "Pending" | "Scheduled" | "Completed" | "Declined";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "Pending", label: "Pending" },
  { key: "Scheduled", label: "Scheduled" },
  { key: "Completed", label: "Completed" },
  { key: "Declined", label: "Declined" },
];

const matchesStatus = (request: MeetingRequest, filter: StatusFilter) => {
  if (filter === "all") return true;
  if (filter === "Declined")
    return request.status === "Declined" || request.status === "Cancelled";
  return request.status === filter;
};

const countByStatus = (requests: MeetingRequest[], filter: StatusFilter) =>
  requests.filter((request) => matchesStatus(request, filter)).length;

const contactIcon = (method?: string) => {
  if (method === "Phone") return Phone;
  if (method === "LinkedIn") return Share2;
  return Mail;
};

const sortByCreated = (a: MeetingRequest, b: MeetingRequest) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

const MeetingsPage = () => {
  const { currentUser } = useAuth();
  const { acceptMeetingRequest, declineMeetingRequest, meetingRequests, posts, users } =
    usePlatformData();
  const [filter, setFilter] = useState<StatusFilter>("all");

  if (!currentUser) return null;

  const myPostIds = useMemo(
    () => posts.filter((post) => post.ownerId === currentUser.id).map((post) => post.id),
    [posts, currentUser.id],
  );

  const incoming = useMemo(
    () =>
      [...meetingRequests]
        .filter((request) => myPostIds.includes(request.postId))
        .sort(sortByCreated),
    [meetingRequests, myPostIds],
  );

  const outgoing = useMemo(
    () =>
      [...meetingRequests]
        .filter((request) => request.requesterId === currentUser.id)
        .sort(sortByCreated),
    [meetingRequests, currentUser.id],
  );

  const allRequests = useMemo(
    () => [
      ...incoming.map((request) => ({ request, type: "incoming" as Direction })),
      ...outgoing.map((request) => ({ request, type: "outgoing" as Direction })),
    ],
    [incoming, outgoing],
  );

  const pendingIncoming = incoming.filter((request) => request.status === "Pending");
  const scheduledCount = allRequests.filter(({ request }) => request.status === "Scheduled").length;
  const completedCount = allRequests.filter(({ request }) => request.status === "Completed").length;

  const visibleIncoming = incoming.filter((request) => matchesStatus(request, filter));
  const visibleOutgoing = outgoing.filter((request) => matchesStatus(request, filter));
  const hasNothing = allRequests.length === 0;
  const hasNothingForFilter = !hasNothing && visibleIncoming.length === 0 && visibleOutgoing.length === 0;

  const RequestCard = ({ request, type }: { request: MeetingRequest; type: Direction }) => {
    const post = posts.find((candidatePost) => candidatePost.id === request.postId);
    const requester = users.find((user) => user.id === request.requesterId);
    const owner = post ? users.find((user) => user.id === post.ownerId) : undefined;
    const handoffUser = type === "incoming" ? requester : owner;
    const ContactIcon = contactIcon(handoffUser?.preferredContact?.method);
    const isUrgent = type === "incoming" && request.status === "Pending";

    return (
      <div
        className={cn(
          "rounded-[28px] border bg-card p-5 animate-fade-in transition-shadow",
          isUrgent
            ? "border-[hsl(var(--warning))]/40 shadow-[0_8px_24px_-12px_hsl(var(--warning)/0.35)]"
            : "border-border",
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{post?.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
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
                className={cn(
                  "flex items-center gap-1 rounded-full border px-3 py-1 text-xs",
                  request.selectedSlot === slot
                    ? "border-success/20 bg-success/10 text-success"
                    : "border-border text-muted-foreground",
                )}
              >
                <Calendar className="h-3 w-3" />
                {new Date(slot).toLocaleString()}
              </span>
            ))}
          </div>
        </div>

        {isUrgent && (
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
      <PageHero
        eyebrow="Coordination"
        title="Meetings"
        description="Manage intro requests, confirm the first slot, and hand off detailed discussion to external channels."
        icon={CalendarClock}
        meta={
          <div className="flex flex-wrap gap-2">
            {pendingIncoming.length > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--warning))]/15 px-3 py-1 text-xs font-semibold text-[hsl(var(--warning))] ring-1 ring-[hsl(var(--warning))]/25">
                <span className="tabular-nums">{pendingIncoming.length}</span> awaiting your reply
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
                Inbox clear
              </span>
            )}
            {scheduledCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success ring-1 ring-success/20">
                <span className="tabular-nums">{scheduledCount}</span> scheduled
              </span>
            )}
            {completedCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
                <span className="tabular-nums">{completedCount}</span> completed
              </span>
            )}
          </div>
        }
      />

      {hasNothing ? (
        <EmptyState
          icon={CalendarClock}
          title="No meeting requests yet"
          description="When someone wants to talk about one of your posts — or you reach out to a collaborator — requests will appear here."
        />
      ) : (
        <>
          {pendingIncoming.length > 0 && filter === "all" && (
            <div className="mb-6 rounded-[28px] border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Inbox className="h-4 w-4 text-[hsl(var(--warning))]" />
                <h3 className="text-sm font-semibold text-[hsl(var(--warning))]">
                  Awaiting your reply ({pendingIncoming.length})
                </h3>
              </div>
              <div className="space-y-3">
                {pendingIncoming.map((request) => (
                  <RequestCard key={request.id} request={request} type="incoming" />
                ))}
              </div>
            </div>
          )}

          <div
            role="tablist"
            className="mb-6 flex flex-wrap gap-1 rounded-full bg-muted p-1"
          >
            {STATUS_TABS.map((tab) => {
              const totalForTab =
                countByStatus(incoming, tab.key) + countByStatus(outgoing, tab.key);
              if (totalForTab === 0 && tab.key !== "all") return null;
              const isActive = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                    isActive
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-muted-foreground/10",
                    )}
                  >
                    {totalForTab}
                  </span>
                </button>
              );
            })}
          </div>

          {hasNothingForFilter ? (
            <div className="rounded-[28px] border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
              No requests in this category.
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Incoming</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                    {visibleIncoming.length}
                  </span>
                </div>
                {visibleIncoming.length > 0 ? (
                  <div className="space-y-3">
                    {visibleIncoming
                      .filter(
                        (request) =>
                          !(filter === "all" && request.status === "Pending"),
                      )
                      .map((request) => (
                        <RequestCard key={request.id} request={request} type="incoming" />
                      ))}
                    {filter === "all" &&
                      visibleIncoming.every((request) => request.status === "Pending") && (
                        <p className="text-xs text-muted-foreground">
                          All incoming requests are surfaced above.
                        </p>
                      )}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-6 text-center text-xs text-muted-foreground">
                    Nothing here.
                  </p>
                )}
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Send className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">My requests</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                    {visibleOutgoing.length}
                  </span>
                </div>
                {visibleOutgoing.length > 0 ? (
                  <div className="space-y-3">
                    {visibleOutgoing.map((request) => (
                      <RequestCard key={request.id} request={request} type="outgoing" />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-6 text-center text-xs text-muted-foreground">
                    Nothing here.
                  </p>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
};

export default MeetingsPage;
