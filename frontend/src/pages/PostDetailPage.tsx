import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { MeetingRequestModal } from "@/components/MeetingRequestModal";
import { StatusBadge } from "@/components/StatusBadge";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useChatDock } from "@/contexts/ChatDockContext";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileX2,
  Handshake,
  Lock,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { openDock } = useChatDock();
  const {
    meetingRequests,
    messages,
    posts,
    setPostStatus,
    submitMeetingRequest,
    removePost,
    users,
  } = usePlatformData();
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const post = useMemo(() => posts.find((candidatePost) => candidatePost.id === id), [id, posts]);

  if (!post || !currentUser) {
    return null;
  }

  // F-02: in real-mode `users` only contains the current user (the
  // /api/admin/users endpoint is admin-only), so users.find() returns
  // undefined when an engineer views a healthcare-owned post. Fall back to
  // the `author` payload returned by GET /api/posts/:id, which carries the
  // same fields we render in the "Posted by" sidebar.
  const ownerFromUsers = users.find((user) => user.id === post.ownerId);
  const owner =
    ownerFromUsers ||
    (post.author
      ? {
          id: post.author.id,
          fullName:
            post.author.fullName ||
            [post.author.firstName, post.author.lastName].filter(Boolean).join(" ") ||
            "",
          institution: post.author.institution || "",
          role: post.author.role || post.ownerRole,
          city: post.author.city || "",
          country: post.author.country || "",
          avatar: post.author.avatar || undefined,
        }
      : undefined);
  const isOwner = currentUser.id === post.ownerId;

  const hasExistingThread = messages.some(
    (message) =>
      message.postId === post.id &&
      (message.senderId === currentUser.id ||
        message.recipientId === currentUser.id),
  );

  if (!isOwner && post.status !== "Active" && currentUser.role !== "admin") {
    return (
      <AppShell>
        <div className="rounded-[28px] border border-border bg-card px-6 py-14 text-center">
          <h1 className="text-xl font-semibold">This post is not available</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Drafts, expired items, and closed posts stay private to their owner and admins.
          </p>
          <Button className="mt-6" onClick={() => navigate("/dashboard")}>
            Return to dashboard
          </Button>
        </div>
      </AppShell>
    );
  }

  const handlePublish = () => {
    setPostStatus(post.id, "Active");
    toast({
      title: "Post published",
      description: "Your post is now visible as a high-level collaboration brief.",
    });
  };

  const handlePartnerFound = () => {
    setPostStatus(post.id, "Partner Found");
    toast({
      title: "Partner found",
      description: "The post is now marked as closed to new first-contact requests.",
    });
  };

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );

  const canMessageOwner =
    !isOwner && post.status === "Active" && currentUser.role !== "admin" && owner;

  const latestCollaborationRequest = [...meetingRequests]
    .filter(
      (request) =>
        request.postId === post.id && request.requesterId === currentUser.id,
    )
    .sort(
      (leftRequest, rightRequest) =>
        new Date(rightRequest.createdAt).getTime() -
        new Date(leftRequest.createdAt).getTime(),
    )[0];

  const collaborationApproved =
    latestCollaborationRequest?.status === "Accepted" ||
    latestCollaborationRequest?.status === "Scheduled" ||
    latestCollaborationRequest?.status === "Completed";
  const collaborationPending = latestCollaborationRequest?.status === "Pending";
  const collaborationDeclined =
    latestCollaborationRequest?.status === "Declined" ||
    latestCollaborationRequest?.status === "Cancelled";

  const handleCollaborationRequest = ({
    message,
    proposedSlots,
    ndaAccepted,
  }: {
    message: string;
    proposedSlots: string[];
    ndaAccepted: boolean;
  }) => {
    submitMeetingRequest({
      postId: post.id,
      requesterId: currentUser.id,
      requesterRole: currentUser.role,
      introductoryMessage: message,
      ndaAccepted,
      proposedSlots,
    });
  };

  return (
    <AppShell>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <section className="relative mb-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-primary/[0.06] via-card/90 to-accent/[0.08] p-6 ring-1 ring-border/60 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(50% 100% at 0% 0%, hsl(var(--accent) / 0.12), transparent 60%), radial-gradient(50% 100% at 100% 100%, hsl(var(--primary) / 0.12), transparent 60%)",
          }}
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span>{post.workingDomain}</span>
              <span className="opacity-50">•</span>
              <span>{post.projectStage}</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {post.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {post.shortExplanation}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={post.status} />
              <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs text-muted-foreground ring-1 ring-border/60">
                <MapPin className="h-3 w-3" />
                {post.city}, {post.country}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs text-muted-foreground ring-1 ring-border/60">
                {post.confidentialityLevel === "Public" ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                {post.confidentialityLevel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs text-muted-foreground ring-1 ring-border/60">
                <Calendar className="h-3 w-3" />
                Expires {post.expiryDate}
              </span>
            </div>
          </div>
          {canMessageOwner && (
            <>
              {collaborationApproved ? (
                <Button
                  size="lg"
                  className="rounded-full px-6 shadow-md"
                  onClick={() =>
                    openDock({ postId: post.id, otherUserId: post.ownerId })
                  }
                >
                  <MessageCircle className="mr-1.5 h-4 w-4" />
                  {hasExistingThread ? "Open conversation" : "Start conversation"}
                </Button>
              ) : collaborationPending ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-6"
                  disabled
                >
                  <Clock className="mr-1.5 h-4 w-4" />
                  Request pending
                </Button>
              ) : collaborationDeclined ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-6"
                  disabled
                >
                  <Clock className="mr-1.5 h-4 w-4" />
                  Request declined
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="rounded-full px-6 shadow-md"
                  onClick={() => setRequestModalOpen(true)}
                >
                  <Send className="mr-1.5 h-4 w-4" />
                  Request collaboration
                </Button>
              )}
            </>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3 animate-fade-in">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-[28px] border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
              <Sparkles className="h-4 w-4 text-accent" />
              Brief overview
            </h2>
            <div className="space-y-0">
              <InfoRow label="Collaboration type" value={post.collaborationType} />
              <InfoRow label="Commitment level" value={post.commitmentLevel} />
              <InfoRow label="Auto-close" value={post.autoClose ? "Yes" : "No"} />
            </div>
          </div>

          <div className="rounded-[28px] border border-border bg-card p-6">
            <h2 className="mb-3 text-base font-semibold">Required expertise</h2>
            <div className="flex flex-wrap gap-2">
              {post.requiredExpertise.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-border bg-card p-6">
            <h2 className="mb-3 text-base font-semibold">High-level idea</h2>
            <p className="text-sm leading-6 text-muted-foreground">{post.highLevelIdea}</p>
          </div>

          <div className="rounded-[28px] border border-border bg-muted/30 p-5">
            <p className="text-sm font-semibold">How it works</p>
            <ol className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
              <li><strong className="text-foreground">1.</strong> Send a collaboration request for this post.</li>
              <li><strong className="text-foreground">2.</strong> The post owner reviews and accepts or declines it.</li>
              <li><strong className="text-foreground">3.</strong> Messaging opens after acceptance.</li>
            </ol>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 ring-1 ring-border/60">
                <FileX2 className="h-3 w-3" />
                No file uploads
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 ring-1 ring-border/60">
                <CheckCircle2 className="h-3 w-3 text-success" />
                Meetings happen off-platform
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {owner && (
            <div className="rounded-[28px] border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold">Posted by</h3>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                  {owner.fullName
                    .split(" ")
                    .map((name) => name[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium">{owner.fullName}</p>
                  <p className="text-xs text-muted-foreground">{owner.institution}</p>
                </div>
              </div>
              <RoleBadge role={owner.role} />
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {owner.city}, {owner.country}
              </p>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Share contact details inside the chat when you're both ready to move off-platform.
              </p>
            </div>
          )}

          {(isOwner || currentUser.role === "admin") && (
            <div className="space-y-2 rounded-[28px] border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold">Actions</h3>
              {isOwner ? (
                <>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/edit-post/${post.id}`)}
                  >
                    Edit post
                  </Button>
                  {post.status === "Draft" && (
                    <Button className="w-full" onClick={handlePublish}>
                      Publish
                    </Button>
                  )}
                  {post.status === "Active" && (
                    <Button className="w-full" onClick={handlePartnerFound}>
                      <Handshake className="mr-1 h-4 w-4" />
                      Mark partner found
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    removePost(post.id, currentUser.id);
                    toast({
                      title: "Post removed",
                      description: "The post has been removed and its meeting requests cancelled.",
                    });
                    navigate("/admin/posts");
                  }}
                >
                  Remove post
                </Button>
              )}
            </div>
          )}

          <div className="rounded-[28px] border border-border p-4 text-xs text-muted-foreground">
            <p>Created: {new Date(post.createdAt).toLocaleDateString()}</p>
            <p>Updated: {new Date(post.updatedAt).toLocaleDateString()}</p>
          </div>

          {(post.statusHistory && post.statusHistory.length > 0) && (
            <div className="rounded-[28px] border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold">Lifecycle history</h3>
              <ol className="space-y-3">
                {post.statusHistory.slice().reverse().map((entry, index) => (
                  <li key={`${entry.status}-${entry.changedAt}-${index}`} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="text-xs">
                      <p className="font-medium">{entry.status}</p>
                      <p className="text-muted-foreground">
                        {new Date(entry.changedAt).toLocaleString()}
                      </p>
                      {entry.reason && (
                        <p className="mt-0.5 italic text-muted-foreground/80">{entry.reason}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>

      <MeetingRequestModal
        open={requestModalOpen}
        onOpenChange={setRequestModalOpen}
        postTitle={post.title}
        onSubmit={handleCollaborationRequest}
      />
    </AppShell>
  );
};

export default PostDetailPage;
