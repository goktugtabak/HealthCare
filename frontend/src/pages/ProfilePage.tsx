import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { SectionHeader } from '@/components/SharedComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RoleBadge } from '@/components/RoleBadge';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Download, Trash2 } from 'lucide-react';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: currentUser?.fullName || '',
    institution: currentUser?.institution || '',
    city: currentUser?.city || '',
    country: currentUser?.country || '',
    bio: currentUser?.bio || '',
  });

  if (!currentUser) return null;

  const handleSave = () => {
    setEditing(false);
    toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
  };

  return (
    <AppShell>
      <SectionHeader title="Profile" />

      <div className="max-w-2xl space-y-6 animate-fade-in">
        {/* Avatar & Role */}
        <div className="rounded-lg border border-border bg-card p-6 flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-xl text-primary-foreground font-semibold">
            {currentUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{currentUser.fullName}</h2>
            <p className="text-sm text-muted-foreground">{currentUser.email}</p>
            <RoleBadge role={currentUser.role} className="mt-1" />
          </div>
          <div className="ml-auto">
            <div className="text-right">
              <p className="text-2xl font-semibold">{currentUser.profileCompleteness}%</p>
              <p className="text-xs text-muted-foreground">Profile Complete</p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Personal Information</h3>
            {!editing && <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>}
          </div>
          {editing ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-sm">Full Name</Label><Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} /></div>
                <div><Label className="text-sm">Institution</Label><Input value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} /></div>
                <div><Label className="text-sm">City</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
                <div><Label className="text-sm">Country</Label><Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} /></div>
              </div>
              <div><Label className="text-sm">Bio</Label><Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} /></div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSave}>Save Changes</Button>
              </div>
            </>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border"><span className="text-muted-foreground">Institution</span><span>{currentUser.institution}</span></div>
              <div className="flex justify-between py-1.5 border-b border-border"><span className="text-muted-foreground">City</span><span>{currentUser.city}</span></div>
              <div className="flex justify-between py-1.5 border-b border-border"><span className="text-muted-foreground">Country</span><span>{currentUser.country}</span></div>
              {currentUser.bio && <div className="pt-2"><span className="text-muted-foreground">Bio</span><p className="mt-1">{currentUser.bio}</p></div>}
            </div>
          )}
        </div>

        {/* Expertise */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-base font-semibold mb-3">Expertise Tags</h3>
          <div className="flex flex-wrap gap-2">
            {currentUser.expertiseTags.map(tag => (
              <span key={tag} className="rounded-md bg-secondary px-2.5 py-1 text-sm text-secondary-foreground">{tag}</span>
            ))}
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-3">
          <h3 className="text-base font-semibold">Data & Privacy</h3>
          <Button variant="outline" size="sm" onClick={() => toast({ title: 'Data export started', description: 'Your data file will be ready shortly.' })}>
            <Download className="h-4 w-4 mr-1" /> Export My Data
          </Button>
          <div>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteModalOpen(true)}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete Account
            </Button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete Account"
        description="This action is irreversible. All your data, posts, and meeting history will be permanently deleted. Are you sure you want to proceed?"
        confirmLabel="Delete My Account"
        destructive
        onConfirm={() => toast({ title: 'Account deletion requested', description: 'Your request has been submitted. (Mock action)' })}
      />
    </AppShell>
  );
};

export default ProfilePage;
