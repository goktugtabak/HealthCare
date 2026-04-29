import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Captcha } from "@/components/Captcha";
import { useAuth } from "@/contexts/AuthContext";
import { isMockMode, toApiError } from "@/api";
import { toast } from "@/hooks/use-toast";
import type { Role } from "@/data/types";

const REAL_MODE = !isMockMode();

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginWithCredentials } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaError, setCaptchaError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(undefined);

    if (!email.trim()) {
      toast({
        title: "Enter your email",
        description: "An institutional email is required for sign-in.",
      });
      return;
    }

    if (!captchaVerified) {
      setCaptchaError("Solve the CAPTCHA to continue");
      return;
    }
    setCaptchaError(undefined);

    if (REAL_MODE && !password) {
      setSubmitError("Password is required");
      return;
    }

    try {
      setSubmitting(true);
      const user = await loginWithCredentials({ email: email.trim(), password, honeypot });
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      const apiError = toApiError(err);
      setSubmitError(apiError.message || "Login failed");
      toast({
        title: "Login failed",
        description: apiError.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const quickLogin = (role: Role) => {
    if (REAL_MODE) return;
    login(role);
    navigate(role === "admin" ? "/admin" : "/dashboard");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to review announcements, requests, and off-platform handoffs.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-4 rounded-[28px] border border-border bg-card p-6 shadow-sm"
        >
          {/* Honeypot — hidden from users, bots fill it. */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
            aria-hidden="true"
          />

          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@institution.edu.tr"
              className="mt-1"
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1"
              autoComplete="current-password"
            />
            {!REAL_MODE && (
              <p className="mt-1 text-xs text-muted-foreground">
                Mock mode — passwords are accepted as-is. Run with VITE_USE_MOCK_DATA=false to enforce real credentials.
              </p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="text-xs text-muted-foreground">
                Remember me
              </Label>
            </div>
            <button type="button" className="text-xs text-primary underline">
              Forgot password?
            </button>
          </div>

          <Captcha
            value={captchaAnswer}
            onChange={(value) => {
              setCaptchaAnswer(value);
              if (captchaError) setCaptchaError(undefined);
            }}
            verified={captchaVerified}
            onVerifiedChange={setCaptchaVerified}
            error={captchaError}
          />

          {submitError && (
            <div
              role="alert"
              className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {submitError}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Signing in…" : "Log in"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Do not have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-primary underline"
            >
              Register
            </button>
          </p>
        </form>

        {!REAL_MODE && (
          <div className="mt-6">
            <div className="mb-4 flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">Quick demo access</span>
              <Separator className="flex-1" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickLogin("engineer")}
                className="text-xs"
              >
                Engineer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickLogin("healthcare")}
                className="text-xs"
              >
                Healthcare
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickLogin("admin")}
                className="text-xs"
              >
                Admin
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
