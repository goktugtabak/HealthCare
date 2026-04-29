import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Globe, Zap, Network, Lock, CheckCircle, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesBento } from "@/components/landing/FeaturesBento";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { RolesSection } from "@/components/landing/RolesSection";

const stats = [
  { label: "Active Professionals", value: "2,500+" },
  { label: "Successful Matches", value: "850+" },
  { label: "Institutions", value: "45" },
  { label: "Projects Initiated", value: "320" },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background selection:bg-primary/30">
      {/* Global Background Glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(40% 50% at 90% 10%, hsl(var(--primary) / 0.08), transparent 100%), radial-gradient(50% 50% at 10% 40%, hsl(var(--accent) / 0.05), transparent 100%), radial-gradient(60% 60% at 50% 90%, hsl(var(--primary) / 0.04), transparent 100%)",
        }}
      />

      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Health AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-muted-foreground hover:text-foreground" onClick={() => navigate("/login")}>
              Log In
            </Button>
            <Button size="sm" className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow" onClick={() => navigate("/register")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main>
        <HeroSection />

        {/* Trusted By Section */}
        <section className="border-y border-white/5 bg-muted/10 py-12 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6">
            <p className="text-center text-xs font-semibold text-muted-foreground/60 mb-8 uppercase tracking-[0.2em]">
              Trusted by leading research institutions
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100">
               <div className="flex items-center gap-2 font-bold text-xl"><Globe className="h-6 w-6"/> MedTech Labs</div>
               <div className="flex items-center gap-2 font-bold text-xl"><Zap className="h-6 w-6"/> NeuroSys</div>
               <div className="flex items-center gap-2 font-bold text-xl"><Network className="h-6 w-6"/> BioData Inc</div>
               <div className="flex items-center gap-2 font-bold text-xl"><Activity className="h-6 w-6"/> HealthCore</div>
            </div>
          </div>
        </section>

        <FeaturesBento />
        <HowItWorks />

        {/* Stats Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 -z-10" />
          <div className="mx-auto max-w-7xl px-6">
            <div className="rounded-[2rem] bg-gradient-to-br from-primary/50 to-accent/50 p-[1px] shadow-2xl">
              <div className="rounded-[2rem] bg-background/95 backdrop-blur-3xl px-8 py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
                  {stats.map((stat) => (
                    <div key={stat.label} className="flex flex-col items-center justify-center">
                      <span className="text-4xl md:text-6xl font-black bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent mb-3 drop-shadow-sm">
                        {stat.value}
                      </span>
                      <span className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <RolesSection />

        {/* Trust & CTA */}
        <section className="relative py-32 overflow-hidden border-t border-white/5">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -z-10" />
          
          <div className="mx-auto max-w-4xl px-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mx-auto mb-8 inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent shadow-[0_0_40px_rgba(var(--primary),0.3)] ring-1 ring-white/20"
            >
              <Lock className="h-12 w-12 text-primary-foreground" />
            </motion.div>
            
            <h2 className="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl">Ready to shape the future?</h2>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground/90 font-light leading-relaxed">
              Join the most secure and effective co-creation platform. No patient data is ever shared on the platform. We strictly facilitate the connection.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-14">
              <Button size="lg" className="h-14 rounded-full px-10 text-lg shadow-xl hover:shadow-primary/30 transition-all duration-300" onClick={() => navigate("/register")}>
                Create Free Account
              </Button>
              <Button variant="outline" size="lg" className="h-14 rounded-full px-10 text-lg bg-background/50 backdrop-blur-md border-white/10 hover:bg-white/5 transition-all duration-300" onClick={() => navigate("/login")}>
                Contact Sales
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
              {["HIPAA Compliant Setup", "End-to-End Encryption", "Verified Professionals"].map((label) => (
                <div key={label} className="flex items-center gap-2 rounded-full border border-white/10 bg-background/40 px-5 py-2.5 backdrop-blur-md shadow-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-background pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Activity className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold tracking-tight">Health AI</span>
              </div>
              <p className="text-sm text-muted-foreground/80 leading-relaxed font-light">
                A structured partner-discovery platform for healthcare innovation. Bridging the gap between clinical needs and engineering capabilities.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Platform</h4>
              <ul className="space-y-3 text-sm text-muted-foreground/80 font-light">
                <li><a href="#" className="hover:text-primary transition-colors">How it works</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">For Engineers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">For Healthcare</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Resources</h4>
              <ul className="space-y-3 text-sm text-muted-foreground/80 font-light">
                <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-1">Documentation <ArrowUpRight className="h-3 w-3" /></a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Case Studies</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground/80 font-light">
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
                <li><Link to="/privacy" className="hover:text-primary transition-colors">KVKK & GDPR</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground/60 font-light">
            <p>© {new Date().getFullYear()} Health AI Co-Creation & Innovation Platform. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
              <a href="#" className="hover:text-foreground transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
