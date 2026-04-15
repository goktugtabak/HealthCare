import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Cpu, Stethoscope, Shield, ArrowRight, Lock, Users, Calendar, CheckCircle } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-14">
          <span className="text-lg font-semibold">Health AI</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Log In</Button>
            <Button size="sm" onClick={() => navigate('/register')}>Register</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Structured Co-Creation for Healthcare Innovation
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Connect engineers and healthcare professionals through secure, purposeful first contact. Post opportunities, discover expertise, schedule external meetings, close the match.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={() => navigate('/register')}>
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/login')}>
            Log In
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-card border-y border-border py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-semibold text-center mb-10">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Post Your Need', desc: 'Describe your project, required expertise, and collaboration preferences.', icon: Users },
              { step: '2', title: 'Discover & Match', desc: 'Browse posts, filter by domain and city, and find the right interdisciplinary partner.', icon: Calendar },
              { step: '3', title: 'Schedule & Connect', desc: 'Request a meeting, accept NDA terms, and schedule your first external conversation.', icon: CheckCircle },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  {item.step}
                </div>
                <h3 className="text-base font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-semibold text-center mb-10">Who Is This For?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Cpu, title: 'Engineers', desc: 'Find clinical partners who understand patient needs. Validate your health-tech prototypes with real domain experts.' },
              { icon: Stethoscope, title: 'Healthcare Professionals', desc: 'Connect with engineers who can build the tools you envision. Share your clinical insights securely.' },
              { icon: Shield, title: 'Administrators', desc: 'Oversee platform activity, manage users and posts, and ensure compliance with institutional policies.' },
            ].map(item => (
              <div key={item.title} className="rounded-lg border border-border bg-card p-6">
                <item.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="text-base font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="bg-card border-y border-border py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Lock className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-3">Built on Trust & Privacy</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-4">
            This platform facilitates first contact only. No patient data should be uploaded or shared. 
            Share only what is needed. Discuss sensitive details during the meeting.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <span className="rounded-full border border-border px-3 py-1">GDPR Compliant</span>
            <span className="rounded-full border border-border px-3 py-1">No Patient Data</span>
            <span className="rounded-full border border-border px-3 py-1">NDA Workflow</span>
            <span className="rounded-full border border-border px-3 py-1">Institutional Verification</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-muted-foreground">
        <p>© 2025 Health AI Co-Creation & Innovation Platform. All rights reserved.</p>
        <p className="mt-1">A structured partner-discovery platform for healthcare innovation.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
