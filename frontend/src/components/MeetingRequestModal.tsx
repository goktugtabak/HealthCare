import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Shield, Plus, X } from 'lucide-react';

export const MeetingRequestModal = ({ open, onOpenChange, postTitle }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postTitle: string;
}) => {
  const [message, setMessage] = useState('');
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [slots, setSlots] = useState<string[]>(['']);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addSlot = () => setSlots(s => [...s, '']);
  const removeSlot = (i: number) => setSlots(s => s.filter((_, idx) => idx !== i));
  const updateSlot = (i: number, v: string) => setSlots(s => s.map((sl, idx) => idx === i ? v : sl));

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!message.trim()) e.message = 'Please write an introductory message';
    if (!ndaAccepted) e.nda = 'You must accept the NDA terms';
    if (slots.filter(s => s).length === 0) e.slots = 'Please propose at least one time slot';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    toast({ title: 'Meeting request sent', description: `Your request for "${postTitle}" has been submitted.` });
    setMessage('');
    setNdaAccepted(false);
    setSlots(['']);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request a Meeting</DialogTitle>
          <DialogDescription>For: {postTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm font-medium">Introductory Message</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Introduce yourself and explain your interest..." className="mt-1" rows={4} />
            {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
          </div>

          <div className="rounded-lg border border-border p-4 bg-muted/30">
            <div className="flex items-start gap-2 mb-3">
              <Shield className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Non-Disclosure Agreement</p>
                <p className="text-xs text-muted-foreground mt-1">
                  By accepting, you agree to keep all information shared during the meeting confidential. 
                  You will not disclose project details, ideas, or data to third parties without written consent.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="nda" checked={ndaAccepted} onCheckedChange={c => setNdaAccepted(!!c)} />
              <Label htmlFor="nda" className="text-xs">I accept the NDA terms</Label>
            </div>
            {errors.nda && <p className="text-xs text-destructive mt-1">{errors.nda}</p>}
          </div>

          <div>
            <Label className="text-sm font-medium">Proposed Time Slots</Label>
            <p className="text-xs text-muted-foreground mb-2">Suggest times for an external meeting.</p>
            {slots.map((slot, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input type="datetime-local" value={slot} onChange={e => updateSlot(i, e.target.value)} className="flex-1" />
                {slots.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeSlot(i)}><X className="h-4 w-4" /></Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addSlot}><Plus className="h-3 w-3 mr-1" /> Add Slot</Button>
            {errors.slots && <p className="text-xs text-destructive mt-1">{errors.slots}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Send Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
