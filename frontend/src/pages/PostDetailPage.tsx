import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import { MapPin, Calendar, Lock, Eye, ArrowLeft, Clock, Handshake } from "lucide-react";
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

  return (
    <AppShell>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="grid gap-6 lg:grid-cols-3 animate-fade-in">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-[28px] border border-border bg-card p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h1 className="text-2xl font-semibold tracking-tight">{post.title}</h1>
              <StatusBadge status={post.status} />
            </div>
            <p className="mb-6 text-muted-foreground">{post.shortExplanation}</p>

            <div className="space-y-0">
              <InfoRow label="Working domain" value={post.workingDomain} />
              <InfoRow label="Project stage" value={post.projectStage} />
              <InfoRow label="Collaboration type" value={post.collaborationType} />
              <InfoRow label="Commitment level" value={post.commitmentLevel} />
              <InfoRow
                label="Location"
                value={
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {post.city}, {post.country}
                  </span>
                }
              />
              <InfoRow
                label="Confidentiality"
                value={
                  <span className="flex items-center gap-1">
                    {post.confidentialityLevel === "Public" ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <Lock className="h-3 w-3" />
                    )}
                    {post.confidentialityLevel}
                  </span>
                }
              />
              <InfoRow
                label="Expiry date"
                value={
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {post.expiryDate}
                  </span>
                }
              />
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

          <div className="rounded-[28px] border border-primary/15 bg-primary/5 p-5">
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Privacy boundary</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  This page is intentionally limited to a high-level collaboration brief. No
                  comments, attachments, or detailed project documents should be shared here. Use
                  the request flow to schedule an external first conversation instead.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
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

          <div className="space-y-2 rounded-[28px] border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold">Actions</h3>
            {isOwner ? (
              <>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/edit-post/${post.id}`)}
                >
                  Edit Post
                </Button>
                {post.status === "Draft" && (
                  <Button className="w-full" onClick={handlePublish}>
                    Publish
                  </Button>
                )}
                {post.status === "Active" && (
                  <Button className="w-full" onClick={handlePartnerFound}>
                    <Handshake className="mr-1 h-4 w-4" />
                    Mark Partner Found
                  </Button>
                )}
              </>
            ) : currentUser.role === "admin" ? (
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
                Remove Post
              </Button>
            ) : existingRequest ? (
              <Button className="w-full" onClick={() => navigate("/meetings")}>
                <Clock className="mr-1 h-4 w-4" />
                Open Request in Meetings
              </Button>
            ) : (
              <Button className="w-full" onClick={() => setMeetingModalOpen(true)}>
                <Clock className="mr-1 h-4 w-4" />
                Request Meeting
              </Button>
            )}
          </div>

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
