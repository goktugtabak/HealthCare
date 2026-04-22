import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Handshake,
  Lock,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { MeetingRequestModal } from "@/components/MeetingRequestModal";

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { meetingRequests, posts, setPostStatus, submitMeetingRequest, users } =
    usePlatformData();
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);

  const post = useMemo(() => posts.find((candidatePost) => candidatePost.id === id), [id, posts]);

  if (!post || !currentUser) {
    return null;
  }

  const owner = users.find((user) => user.id === post.ownerId);
  const isOwner = currentUser.id === post.ownerId;
  const existingRequest = meetingRequests.find(
    (request) => request.postId === post.id && request.requesterId === currentUser.id,
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

  const canRequestMeeting =
    !isOwner && post.status === "Active" && currentUser.role !== "admin";

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
          {canRequestMeeting && !existingRequest && (
            <Button
              size="lg"
              className="rounded-full px-5 shadow-md"
              onClick={() => setMeetingModalOpen(true)}
            >
              <Clock className="mr-1.5 h-4 w-4" />
              Request meeting
            </Button>
          )}
          {existingRequest && (
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-5"
              onClick={() => navigate("/meetings")}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              Request sent — open in Meetings
            </Button>
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

          <div className="relative overflow-hidden rounded-[28px] border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-accent/[0.05] p-5">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl"
            />
            <div className="relative flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/20">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">NDA-protected first contact</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  This page intentionally stays at a high level — no comments, files, or detailed
                  documents. When you request a meeting, you'll accept a mutual NDA before any
                  sensitive context is shared. Detailed work happens off-platform after the intro.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 ring-1 ring-border/60">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    Mutual NDA
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 ring-1 ring-border/60">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    No file uploads
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 ring-1 ring-border/60">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    External handoff
                  </span>
                </div>
              </div>
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
                Contact details are shared only after a meeting request is scheduled.
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
                    toast({
                      title: "Admin action unavailable",
                      description: "Admin redesign is planned for the next phase.",
                    });
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
        </div>
      </div>

      <MeetingRequestModal
        open={meetingModalOpen}
        onOpenChange={setMeetingModalOpen}
        postTitle={post.title}
        onSubmit={({ message, ndaAccepted, proposedSlots }) => {
          submitMeetingRequest({
            postId: post.id,
            requesterId: currentUser.id,
            requesterRole: currentUser.role,
            introductoryMessage: message,
            ndaAccepted,
            proposedSlots,
          });
        }}
      />
    </AppShell>
  );
};

export default PostDetailPage;
