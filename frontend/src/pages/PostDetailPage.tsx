import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { StatusBadge } from '@/components/StatusBadge';
import { RoleBadge } from '@/components/RoleBadge';
import { Button } from '@/components/ui/button';
import { mockPosts, mockUsers } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Calendar, Lock, Eye, ArrowLeft, Clock, Handshake } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MeetingRequestModal } from '@/components/MeetingRequestModal';

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [post, setPost] = useState(mockPosts.find(p => p.id === id));
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);

  if (!post || !currentUser) return null;

  const owner = mockUsers.find(u => u.id === post.ownerId);
  const isOwner = currentUser.id === post.ownerId;

  const handlePublish = () => {
    setPost(p => p ? { ...p, status: 'Active' } : p);
    toast({ title: 'Post published', description: 'Your post is now visible to all users.' });
  };

  const handlePartnerFound = () => {
    setPost(p => p ? { ...p, status: 'Partner Found' } : p);
    toast({ title: 'Congratulations!', description: 'Post marked as Partner Found.' });
  };

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );

  return (
    <AppShell>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-xl font-semibold">{post.title}</h1>
              <StatusBadge status={post.status} />
            </div>
            <p className="text-muted-foreground mb-6">{post.shortExplanation}</p>

            <div className="space-y-0">
              <InfoRow label="Working Domain" value={post.workingDomain} />
              <InfoRow label="Project Stage" value={post.projectStage} />
              <InfoRow label="Collaboration Type" value={post.collaborationType} />
              <InfoRow label="Commitment Level" value={post.commitmentLevel} />
              <InfoRow label="Location" value={<span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{post.city}, {post.country}</span>} />
              <InfoRow label="Confidentiality" value={
                <span className="flex items-center gap-1">
                  {post.confidentialityLevel === 'Public' ? <Eye className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {post.confidentialityLevel}
                </span>
              } />
              <InfoRow label="Expiry Date" value={<span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{post.expiryDate}</span>} />
              <InfoRow label="Auto-Close" value={post.autoClose ? 'Yes' : 'No'} />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-base font-semibold mb-3">Required Expertise</h2>
            <div className="flex flex-wrap gap-2">
              {post.requiredExpertise.map(tag => (
                <span key={tag} className="rounded-md bg-secondary px-2.5 py-1 text-sm text-secondary-foreground">{tag}</span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-base font-semibold mb-3">High-Level Idea</h2>
            <p className="text-sm text-muted-foreground">{post.highLevelIdea}</p>
          </div>

          {post.confidentialityLevel !== 'Public' && (
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Confidentiality Notice</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This post is marked as {post.confidentialityLevel}. Detailed discussions should take place during a scheduled meeting. NDA acceptance is required before meeting.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {owner && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-3">Posted by</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-sm text-primary-foreground font-medium">
                  {owner.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium">{owner.fullName}</p>
                  <p className="text-xs text-muted-foreground">{owner.institution}</p>
                </div>
              </div>
              <RoleBadge role={owner.role} />
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {owner.city}, {owner.country}
              </p>
            </div>
          )}

          <div className="rounded-lg border border-border bg-card p-5 space-y-2">
            <h3 className="text-sm font-semibold mb-3">Actions</h3>
            {isOwner ? (
              <>
                <Button variant="outline" className="w-full" onClick={() => navigate(`/edit-post/${post.id}`)}>Edit Post</Button>
                {post.status === 'Draft' && <Button className="w-full" onClick={handlePublish}>Publish</Button>}
                {post.status === 'Active' && (
                  <Button className="w-full" onClick={handlePartnerFound}>
                    <Handshake className="h-4 w-4 mr-1" /> Mark Partner Found
                  </Button>
                )}
              </>
            ) : currentUser.role === 'admin' ? (
              <Button variant="destructive" className="w-full" onClick={() => { toast({ title: 'Post removed', description: 'The post has been removed.' }); navigate(-1); }}>
                Remove Post
              </Button>
            ) : (
              <Button className="w-full" onClick={() => setMeetingModalOpen(true)}>
                <Clock className="h-4 w-4 mr-1" /> Request Meeting
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground rounded-lg border border-border p-4">
            <p>Created: {new Date(post.createdAt).toLocaleDateString()}</p>
            <p>Updated: {new Date(post.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <MeetingRequestModal open={meetingModalOpen} onOpenChange={setMeetingModalOpen} postTitle={post.title} />
    </AppShell>
  );
};

export default PostDetailPage;
