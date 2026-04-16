import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Shield, Plus, X } from "lucide-react";

interface MeetingRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postTitle: string;
  onSubmit: (payload: {
    message: string;
    ndaAccepted: boolean;
    proposedSlots: string[];
  }) => void;
}

export const MeetingRequestModal = ({
  open,
  onOpenChange,
  postTitle,
  onSubmit,
}: MeetingRequestModalProps) => {
  const [message, setMessage] = useState("");
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [slots, setSlots] = useState<string[]>([""]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addSlot = () => setSlots((currentSlots) => [...currentSlots, ""]);
  const removeSlot = (index: number) =>
    setSlots((currentSlots) => currentSlots.filter((_, slotIndex) => slotIndex !== index));
  const updateSlot = (index: number, value: string) =>
    setSlots((currentSlots) =>
      currentSlots.map((slot, slotIndex) => (slotIndex === index ? value : slot)),
    );

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {};
    const cleanSlots = slots.map((slot) => slot.trim()).filter(Boolean);

    if (!message.trim()) nextErrors.message = "Please write an introductory message";
    if (!ndaAccepted) nextErrors.nda = "You must accept the confidentiality terms";
    if (cleanSlots.length === 0) nextErrors.slots = "Please propose at least one time slot";

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({
      message: message.trim(),
      ndaAccepted,
      proposedSlots: cleanSlots,
    });

    toast({
      title: "Request sent",
      description: `Your first-contact request for "${postTitle}" has been sent.`,
    });

    setMessage("");
    setNdaAccepted(false);
    setSlots([""]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request a first meeting</DialogTitle>
          <DialogDescription>
            For: {postTitle}. Keep this high-level and use it to agree on the first external
            conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm font-medium">Introductory message</Label>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Introduce yourself, explain why there is a fit, and frame the first external conversation."
              className="mt-1"
              rows={4}
            />
            {errors.message && (
              <p className="mt-1 text-xs text-destructive">{errors.message}</p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="mb-3 flex items-start gap-2">
              <Shield className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Confidentiality acknowledgement</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  You are agreeing to keep shared ideas confidential and to move sensitive
                  discussion off-platform. This app does not host files or detailed project assets.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="nda"
                checked={ndaAccepted}
                onCheckedChange={(checked) => setNdaAccepted(!!checked)}
              />
              <Label htmlFor="nda" className="text-xs">
                I agree to keep details confidential and continue sensitive discussion externally
              </Label>
            </div>
            {errors.nda && <p className="mt-1 text-xs text-destructive">{errors.nda}</p>}
          </div>

          <div>
            <Label className="text-sm font-medium">Proposed time slots</Label>
            <p className="mb-2 text-xs text-muted-foreground">
              Offer one or more times for the first off-platform meeting.
            </p>
            {slots.map((slot, index) => (
              <div key={index} className="mb-2 flex gap-2">
                <Input
                  type="datetime-local"
                  value={slot}
                  onChange={(event) => updateSlot(index, event.target.value)}
                  className="flex-1"
                />
                {slots.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeSlot(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addSlot}>
              <Plus className="mr-1 h-3 w-3" />
              Add slot
            </Button>
            {errors.slots && <p className="mt-1 text-xs text-destructive">{errors.slots}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Send request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
