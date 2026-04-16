import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { Role } from "@/data/types";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginByEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      toast({
        title: "Enter your email",
        description: "This frontend demo matches accounts by email for sign-in.",
      });
      return;
    }

    const didLogin = loginByEmail(email);

    if (!didLogin) {
      toast({
        title: "Account not found",
        description:
          "Use one of the demo shortcuts or register a new account. Passwords are not persisted in this frontend-only demo.",
      });
      return;
    }

    void password;
    navigate("/dashboard");
  };

  const quickLogin = (role: Role) => {
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
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Passwords are UI-only in this frontend demo. Email match controls access.
            </p>
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
          <Button type="submit" className="w-full">
            Log in
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
      </div>
    </div>
  );
};

export default LoginPage;
