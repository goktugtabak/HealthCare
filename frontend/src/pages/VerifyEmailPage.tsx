import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, MailCheck, ShieldCheck } from "lucide-react";

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const { currentUser, updateCurrentUserProfile } = useAuth();
  const { addActivityLog } = usePlatformData();
  const [resending, setResending] = useState(false);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center space-y-4">
          <h1 className="text-2xl font-semibold">Email verification</h1>
          <p className="text-sm text-muted-foreground">
            Sign in or register first to verify your email address.
          </p>
          <Button onClick={() => navigate("/login")}>Go to login</Button>
        </div>
      </div>
    );
  }

  const isVerified = currentUser.emailVerified ?? false;

  const handleConfirm = () => {
    updateCurrentUserProfile({ emailVerified: true });
    addActivityLog({
      userId: currentUser.id,
      userName: currentUser.fullName,
      role: currentUser.role,
      actionType: "Email Verified",
      targetEntity: currentUser.email,
    });
    toast({
      title: "Email verified",
      description: "Thanks! Your email address is now verified.",
    });
    navigate(currentUser.onboardingCompleted ? "/dashboard" : "/onboarding");
  };

  const handleResend = () => {
    setResending(true);
    addActivityLog({
      userId: currentUser.id,
      userName: currentUser.fullName,
      role: currentUser.role,
      actionType: "Email Verification Resent",
      targetEntity: currentUser.email,
    });
    setTimeout(() => {
      setResending(false);
      toast({
        title: "Verification link re-sent",
        description: `Mock email sent to ${currentUser.email}.`,
      });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MailCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Verify your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link to <strong>{currentUser.email}</strong>. Click the link to
            confirm your address. (Demo: use the button below to simulate clicking the link.)
          </p>
        </div>

        <div className="space-y-3 rounded-[28px] border border-border bg-card p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
            <div className="text-sm">
              <p className="font-medium">Why we ask</p>
              <p className="mt-1 text-muted-foreground">
                Verifying your institutional email helps us mitigate fake accounts (FR-01, FR-07).
                Without verification, your account is treated as an unverified trust signal.
              </p>
            </div>
          </div>

          {isVerified ? (
            <div className="flex items-center gap-2 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              Email already verified.
            </div>
          ) : (
            <>
              <Button className="w-full" onClick={handleConfirm}>
                I clicked the link — confirm verification
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? "Re-sending…" : "Resend verification email"}
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate(currentUser.onboardingCompleted ? "/dashboard" : "/onboarding")}
          >
            Continue without verifying
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
