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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface MeetingRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postTitle: string;
  onSubmit: (payload: {
    message: string;
  }) => void;
}

export const MeetingRequestModal = ({
  open,
  onOpenChange,
  postTitle,
  onSubmit,
}: MeetingRequestModalProps) => {
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setMessage("");
    setErrors({});
  };

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {};

    if (!message.trim()) {
      nextErrors.message = "Please write a collaboration request message";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({
      message: message.trim(),
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
          <DialogTitle>Send collaboration request</DialogTitle>
          <DialogDescription>
            For: {postTitle}. The post owner must accept before messaging opens.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm font-medium">
              Introductory message
            </Label>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Introduce yourself, explain the fit, and describe what you want to collaborate on."
              className="mt-1"
              rows={4}
            />
            {errors.message && (
              <p className="mt-1 text-xs text-destructive">
                {errors.message}
              </p>
            )}
          </div>

          <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs leading-5 text-muted-foreground">
            Messaging stays locked until the post owner accepts this request.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
