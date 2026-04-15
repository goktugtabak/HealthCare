import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/data/types';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // mock: just login as engineer by default
    login('engineer');
    navigate('/dashboard');
  };

  const quickLogin = (role: Role) => {
    login(role);
    navigate(role === 'admin' ? '/admin' : '/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-1">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">Log in to the Health AI Platform</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4 rounded-lg border border-border bg-card p-6">
          <div>
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@university.edu.tr" />
          </div>
          <div>
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="text-xs text-muted-foreground">Remember me</Label>
            </div>
            <button type="button" className="text-xs text-primary underline">Forgot password?</button>
          </div>
          <Button type="submit" className="w-full">Log In</Button>
          <p className="text-center text-xs text-muted-foreground">
            Don't have an account?{' '}
            <button type="button" onClick={() => navigate('/register')} className="text-primary underline">Register</button>
          </p>
        </form>

        <div className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">Quick Demo Access</span>
            <Separator className="flex-1" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={() => quickLogin('engineer')} className="text-xs">Engineer</Button>
            <Button variant="outline" size="sm" onClick={() => quickLogin('healthcare')} className="text-xs">Healthcare</Button>
            <Button variant="outline" size="sm" onClick={() => quickLogin('admin')} className="text-xs">Admin</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
