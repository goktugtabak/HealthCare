import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { CalendarPlus, ShieldCheck, X } from "lucide-react";

interface MeetingRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postTitle: string;
  onSubmit: (payload: {
    message: string;
    proposedSlots: string[];
    ndaAccepted: boolean;
  }) => void;
}

type Step = "message" | "nda";

export const MeetingRequestModal = ({
  open,
  onOpenChange,
  postTitle,
  onSubmit,
}: MeetingRequestModalProps) => {
  const [step, setStep] = useState<Step>("message");
  const [message, setMessage] = useState("");
  const [slots, setSlots] = useState<string[]>([""]);
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setStep("message");
    setMessage("");
    setSlots([""]);
    setNdaAccepted(false);
    setErrors({});
  };

  const handleSlotChange = (index: number, value: string) => {
    setSlots((current) => current.map((slot, idx) => (idx === index ? value : slot)));
  };

  const addSlot = () => {
    if (slots.length >= 5) return;
    setSlots((current) => [...current, ""]);
  };

  const removeSlot = (index: number) => {
    setSlots((current) =>
      current.length === 1 ? current : current.filter((_, idx) => idx !== index),
    );
  };

  const handleContinue = () => {
    const nextErrors: Record<string, string> = {};

    if (!message.trim()) {
      nextErrors.message = "Please write a collaboration request message";
    }

    const cleanSlots = slots.map((slot) => slot.trim()).filter(Boolean);
    if (cleanSlots.length === 0) {
      nextErrors.slots = "Suggest at least one time slot";
    } else if (cleanSlots.some((slot) => Number.isNaN(new Date(slot).getTime()))) {
      nextErrors.slots = "All slots must be valid date-times";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStep("nda");
  };

  const handleSubmit = () => {
    if (!ndaAccepted) {
      setErrors({ nda: "You must accept the confidentiality terms to continue" });
      return;
    }

    const cleanSlots = slots.map((slot) => slot.trim()).filter(Boolean);

    onSubmit({
      message: message.trim(),
      proposedSlots: cleanSlots,
      ndaAccepted: true,
    });

    toast({
      title: "Request sent",
      description: `Your collaboration request for "${postTitle}" has been sent.`,
    });

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "message" ? "Send collaboration request" : "Confidentiality acknowledgement"}
          </DialogTitle>
          <DialogDescription>
            {step === "message"
              ? `For: ${postTitle}. Step 1 of 2 — share context and propose slots.`
              : `For: ${postTitle}. Step 2 of 2 — review and accept the confidentiality terms.`}
          </DialogDescription>
        </DialogHeader>

        {step === "message" ? (
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium">Introductory message</Label>
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Introduce yourself, explain the fit, and describe what you want to collaborate on."
                className="mt-1"
                rows={4}
              />
              {errors.message && (
                <p className="mt-1 text-xs text-destructive">{errors.message}</p>
              )}
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <Label className="text-sm font-medium">Proposed time slots</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={addSlot}
                  disabled={slots.length >= 5}
                >
                  <CalendarPlus className="mr-1 h-3 w-3" /> Add slot
                </Button>
              </div>
              <div className="space-y-2">
                {slots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="datetime-local"
                      value={slot}
                      onChange={(event) => handleSlotChange(index, event.target.value)}
                      className="flex-1"
                    />
                    {slots.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0"
                        onClick={() => removeSlot(index)}
                        aria-label="Remove slot"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {errors.slots && (
                <p className="mt-1 text-xs text-destructive">{errors.slots}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Owner picks one of these when accepting. Up to 5 slots.
              </p>
            </div>

            <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs leading-5 text-muted-foreground">
              Messaging stays locked until the post owner accepts this request.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                <div className="text-sm leading-6">
                  <p className="font-semibold">Mutual confidentiality terms</p>
                  <p className="mt-2 text-muted-foreground">
                    By sending this collaboration request you acknowledge that:
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                    <li>You will not redistribute information shared in this thread.</li>
                    <li>
                      No patient or sensitive clinical data is permitted on the platform — share
                      only at the agreed external channel after first contact.
                    </li>
                    <li>
                      Either party may withdraw consent and request deletion of shared messages.
                    </li>
                    <li>
                      Acceptance is logged for audit (FR-50/FR-31) but no patient data is recorded.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/30 p-4">
              <Checkbox
                id="nda-accept"
                checked={ndaAccepted}
                onCheckedChange={(checked) => {
                  setNdaAccepted(!!checked);
                  if (checked) setErrors({});
                }}
                className="mt-0.5"
              />
              <Label htmlFor="nda-accept" className="text-sm leading-5">
                I have read and accept the confidentiality terms above. I understand this is logged
                with a timestamp and forms part of the platform audit trail.
              </Label>
            </div>
            {errors.nda && (
              <p className="text-xs text-destructive">{errors.nda}</p>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "message" ? (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleContinue}>
                Continue to NDA
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => setStep("message")}>
                Back
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={!ndaAccepted}>
                Accept and send request
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
