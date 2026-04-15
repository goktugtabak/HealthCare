import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', role: '', institution: '', city: '', country: '', terms: false });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string) => {
    const institutional = /\.(edu|edu\.tr|ac\.uk|uni\.\w+)$/i;
    return institutional.test(email.split('@')[1] || '');
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!validateEmail(form.email)) e.email = 'Please use an institutional email (.edu, .edu.tr, etc.)';
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.role) e.role = 'Please select a role';
    if (!form.institution.trim()) e.institution = 'Institution is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.country.trim()) e.country = 'Country is required';
    if (!form.terms) e.terms = 'You must accept the terms';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (validate()) {
      setSubmitted(true);
      toast({ title: 'Registration successful', description: 'A verification email has been sent.' });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center animate-fade-in">
          <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Verification Email Sent</h1>
          <p className="text-sm text-muted-foreground mb-6">
            We've sent a verification link to <strong>{form.email}</strong>. Please check your inbox and verify your email address to continue.
          </p>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  const Field = ({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-1">Create Your Account</h1>
          <p className="text-sm text-muted-foreground">Join the Health AI Co-Creation Platform</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-card p-6">
          <Field id="fullName" label="Full Name" error={errors.fullName}>
            <Input id="fullName" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Dr. Jane Smith" />
          </Field>
          <Field id="email" label="Institutional Email" error={errors.email}>
            <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="name@university.edu.tr" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field id="password" label="Password" error={errors.password}>
              <Input id="password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </Field>
            <Field id="confirmPassword" label="Confirm Password" error={errors.confirmPassword}>
              <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
            </Field>
          </div>
          <Field id="role" label="Role" error={errors.role}>
            <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
              <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="engineer">Engineer</SelectItem>
                <SelectItem value="healthcare">Healthcare Professional</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field id="institution" label="Institution" error={errors.institution}>
            <Input id="institution" value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} placeholder="University / Hospital name" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field id="city" label="City" error={errors.city}>
              <Input id="city" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Ankara" />
            </Field>
            <Field id="country" label="Country" error={errors.country}>
              <Input id="country" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="Turkey" />
            </Field>
          </div>
          <div className="flex items-start gap-2">
            <Checkbox id="terms" checked={form.terms} onCheckedChange={(c) => setForm(f => ({ ...f, terms: !!c }))} className="mt-0.5" />
            <Label htmlFor="terms" className="text-xs text-muted-foreground leading-tight">
              I agree to the Terms of Service and Privacy Policy. I understand that no patient data should be shared on this platform.
            </Label>
          </div>
          {errors.terms && <p className="text-xs text-destructive">{errors.terms}</p>}
          <Button type="submit" className="w-full">Create Account</Button>
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <button type="button" onClick={() => navigate('/login')} className="text-primary underline">Log in</button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
