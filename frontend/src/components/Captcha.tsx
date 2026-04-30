import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RefreshCw, ShieldCheck } from "lucide-react";

interface CaptchaProps {
  value: string;
  onChange: (value: string) => void;
  verified: boolean;
  onVerifiedChange: (verified: boolean) => void;
  error?: string;
  label?: string;
}

const buildChallenge = () => {
  const left = Math.floor(Math.random() * 9) + 1;
  const right = Math.floor(Math.random() * 9) + 1;
  return { left, right, expected: left + right };
};

export const Captcha = ({
  value,
  onChange,
  verified,
  onVerifiedChange,
  error,
  label = "Verify you are human",
}: CaptchaProps) => {
  const [challenge, setChallenge] = useState(() => buildChallenge());

  useEffect(() => {
    const numeric = Number(value);
    if (!Number.isNaN(numeric) && numeric === challenge.expected) {
      onVerifiedChange(true);
    } else if (verified) {
      onVerifiedChange(false);
    }
  }, [challenge.expected, onVerifiedChange, value, verified]);

  const refresh = () => {
    setChallenge(buildChallenge());
    onChange("");
    onVerifiedChange(false);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-end gap-3">
        <div className="flex h-10 items-center justify-center rounded-lg border border-border bg-muted/40 px-4 font-mono text-sm tabular-nums tracking-wider">
          {challenge.left} + {challenge.right} = ?
        </div>
        <Input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Answer"
          className="w-24"
          aria-label="CAPTCHA answer"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0"
          onClick={refresh}
          aria-label="Refresh CAPTCHA"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        {verified && (
          <span className="inline-flex items-center gap-1 text-xs text-success">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified
          </span>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};
