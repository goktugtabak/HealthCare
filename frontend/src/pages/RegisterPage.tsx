import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ShieldAlert } from "lucide-react";

const institutionalEmailPattern = /\.(edu|edu\.tr|ac\.\w+|edu\.\w+)$/i;

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const emailLooksInstitutional = useMemo(() => {
    const domain = form.email.split("@")[1] ?? "";
    return institutionalEmailPattern.test(domain);
  }, [form.email]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.fullName.trim()) nextErrors.fullName = "Full name is required";
    if (!form.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      nextErrors.email = "Enter a valid email address";
    }

    if (!form.password || form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }

    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    if (!form.role) nextErrors.role = "Please select a role";
    if (!form.terms) nextErrors.terms = "You must accept the terms";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    register({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      role: form.role as "engineer" | "healthcare",
    });

    toast({
      title: "Account created",
      description:
        "Complete your onboarding to unlock the role-specific dashboard experience.",
    });

    navigate("/onboarding");
  };

  const Field = ({
    id,
    label,
    error,
    children,
  }: {
    id: string;
    label: string;
    error?: string;
    children: React.ReactNode;
  }) => (
    <div>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Fast signup first. You will complete your matching profile on the next step.
          </p>
        </div>

        <div className="mb-5 rounded-2xl border border-primary/15 bg-primary/5 p-4">
          <div className="flex gap-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Institutional email is a trust signal, not proof</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This frontend demo can encourage institutional addresses, but it cannot truly
                verify ownership without backend support.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-[28px] border border-border bg-card p-6 shadow-sm"
        >
          <Field id="fullName" label="Full name" error={errors.fullName}>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(event) =>
                setForm((currentForm) => ({ ...currentForm, fullName: event.target.value }))
              }
              placeholder="Dr. Jane Smith"
              className="mt-1"
            />
          </Field>

          <Field id="email" label="Email" error={errors.email}>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((currentForm) => ({ ...currentForm, email: event.target.value }))
              }
              placeholder="name@institution.edu.tr"
              className="mt-1"
            />
            {form.email && !emailLooksInstitutional && (
              <p className="mt-1 text-xs text-amber-600">
                This does not look like an institutional domain. You can continue, but the app
                will treat the address as unverified trust information only.
              </p>
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="password" label="Password" error={errors.password}>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, password: event.target.value }))
                }
                className="mt-1"
              />
            </Field>
            <Field id="confirmPassword" label="Confirm password" error={errors.confirmPassword}>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    confirmPassword: event.target.value,
                  }))
                }
                className="mt-1"
              />
            </Field>
          </div>

          <Field id="role" label="Role" error={errors.role}>
            <Select
              value={form.role}
              onValueChange={(value) =>
                setForm((currentForm) => ({ ...currentForm, role: value }))
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="engineer">Engineer</SelectItem>
                <SelectItem value="healthcare">Healthcare Professional</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/30 p-4">
            <Checkbox
              id="terms"
              checked={form.terms}
              onCheckedChange={(checked) =>
                setForm((currentForm) => ({ ...currentForm, terms: !!checked }))
              }
              className="mt-0.5"
            />
            <div>
              <Label htmlFor="terms" className="text-sm leading-5">
                I understand this platform is for high-level first contact only.
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                No patient data, file sharing, or sensitive project detail belongs here. Deeper
                conversations happen off-platform after mutual agreement.
              </p>
              {errors.terms && <p className="mt-2 text-xs text-destructive">{errors.terms}</p>}
            </div>
          </div>

          <Button type="submit" className="w-full">
            Continue to onboarding
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-primary underline"
            >
              Log in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
