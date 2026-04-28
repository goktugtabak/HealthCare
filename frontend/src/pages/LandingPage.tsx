import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Cpu,
  Lock,
  Shield,
  Stethoscope,
  Users,
  Activity,
  Globe,
  Zap,
  Network,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroScene = lazy(() => import("@/components/three/HeroScene"));

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const howItWorks = [
  {
    step: "1",
    title: "Post Your Need",
    desc: "Describe your project, required expertise, and collaboration preferences in a secure environment.",
    icon: Users,
  },
  {
    step: "2",
    title: "Discover & Match",
    desc: "Browse posts, filter by domain and city, and find the right interdisciplinary partner instantly.",
    icon: Calendar,
  },
  {
    step: "3",
    title: "Schedule & Connect",
    desc: "Request a meeting, accept NDA terms, and schedule your first external conversation safely.",
    icon: CheckCircle,
  },
];

const roles = [
  {
    icon: Cpu,
    title: "Engineers & Developers",
    desc: "Find clinical partners who understand patient needs. Validate your health-tech prototypes with real domain experts before writing a single line of code.",
    color: "from-blue-500/20 to-indigo-500/20",
    textColor: "text-indigo-400"
  },
  {
    icon: Stethoscope,
    title: "Healthcare Professionals",
    desc: "Connect with engineers who can build the tools you envision. Share your clinical insights securely to shape the future of medical technology.",
    color: "from-teal-500/20 to-emerald-500/20",
    textColor: "text-teal-400"
  },
  {
    icon: Shield,
    title: "Administrators",
    desc: "Oversee platform activity, manage users and posts, and ensure strict compliance with institutional policies and data governance.",
    color: "from-orange-500/20 to-red-500/20",
    textColor: "text-orange-400"
  },
];

const stats = [
  { label: "Active Professionals", value: "2,500+" },
  { label: "Successful Matches", value: "850+" },
  { label: "Institutions", value: "45" },
  { label: "Projects Initiated", value: "320" },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background selection:bg-primary/30">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(40% 50% at 90% 10%, hsl(var(--primary) / 0.1), transparent 100%), radial-gradient(50% 50% at 10% 40%, hsl(var(--accent) / 0.08), transparent 100%), radial-gradient(60% 60% at 50% 90%, hsl(var(--primary) / 0.05), transparent 100%)",
        }}
      />

      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Health AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => navigate("/login")}>
              Log In
            </Button>
            <Button size="sm" className="rounded-full px-6 shadow-lg shadow-primary/20" onClick={() => navigate("/register")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pt-32 pb-24 md:pt-40 md:pb-32 lg:min-h-screen lg:flex lg:items-center">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8 w-full">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="relative z-10 max-w-2xl"
          >
            <motion.div
              variants={fadeUp}
              custom={0}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-md"
            >
              <Sparkles className="h-4 w-4" />
              <span>The bridge between medicine and code</span>
            </motion.div>
            
            <motion.h1
              variants={fadeUp}
              custom={0.1}
              className="text-5xl font-extrabold tracking-tight md:text-7xl lg:text-[5.5rem] leading-[1.1]"
            >
              Structured <br/>
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">
                Co-Creation
              </span>
            </motion.h1>
            
            <motion.p
              variants={fadeUp}
              custom={0.2}
              className="mt-6 max-w-xl text-lg text-muted-foreground md:text-xl leading-relaxed"
            >
              Connect brilliant engineers with visionary healthcare professionals through secure, purposeful first contact. Build the next generation of health-tech together.
            </motion.p>
            
            <motion.div
              variants={fadeUp}
              custom={0.3}
              className="mt-10 flex flex-col sm:flex-row gap-4"
            >
              <Button size="lg" className="h-14 rounded-full px-8 text-base shadow-xl shadow-primary/20 group" onClick={() => navigate("/register")}>
                Start Collaborating
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" size="lg" className="h-14 rounded-full px-8 text-base border-border/60 hover:bg-muted/50" onClick={() => navigate("/login")}>
                Explore Projects
              </Button>
            </motion.div>
            
            <motion.div
              variants={fadeUp}
              custom={0.4}
              className="mt-12 flex items-center gap-4 text-sm text-muted-foreground"
            >
              <div className="flex -space-x-3">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                  </div>
                ))}
              </div>
              <p>Join <strong className="text-foreground font-semibold">2,500+</strong> innovators</p>
            </motion.div>
          </motion.div>

          <div className="relative h-[400px] w-full md:h-[600px] lg:h-[700px]">
            <div
              aria-hidden
              className="absolute inset-10 -z-10 rounded-full bg-primary/20 blur-[100px]"
            />
            {!reduceMotion && (
              <Suspense fallback={<div className="h-full w-full animate-pulse rounded-3xl bg-card/40" />}>
                <HeroScene />
              </Suspense>
            )}
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="border-y border-border/40 bg-muted/20 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-widest">Trusted by leading research institutions</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale transition-all hover:grayscale-0">
             {/* Placeholder logos for visual effect */}
             <div className="flex items-center gap-2 font-bold text-xl"><Globe className="h-6 w-6"/> MedTech Labs</div>
             <div className="flex items-center gap-2 font-bold text-xl"><Zap className="h-6 w-6"/> NeuroSys</div>
             <div className="flex items-center gap-2 font-bold text-xl"><Network className="h-6 w-6"/> BioData Inc</div>
             <div className="flex items-center gap-2 font-bold text-xl"><Activity className="h-6 w-6"/> HealthCore</div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-24 md:py-32 relative">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl mb-4">Everything you need to <span className="text-primary">innovate.</span></h2>
            <p className="text-lg text-muted-foreground">We've built a comprehensive ecosystem that removes the friction from interdisciplinary collaboration.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
            {/* Bento Box 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 relative overflow-hidden rounded-3xl border border-border/50 bg-card/50 p-8 hover:bg-card/80 transition-colors"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Network className="w-48 h-48" />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Smart Matchmaking</h3>
                  <p className="text-muted-foreground text-lg max-w-md">Our algorithm pairs engineering capabilities with specific clinical needs, ensuring high-impact collaborations.</p>
                </div>
              </div>
            </motion.div>

            {/* Bento Box 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-accent/20 to-transparent p-8"
            >
              <div className="h-full flex flex-col justify-between">
                <div className="w-14 h-14 rounded-2xl bg-background/50 backdrop-blur flex items-center justify-center text-accent mb-6 shadow-sm">
                  <Shield className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">NDA Integrated</h3>
                  <p className="text-muted-foreground">Built-in legal workflows protect your IP from day one.</p>
                </div>
              </div>
            </motion.div>

            {/* Bento Box 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/50 p-8 hover:bg-card/80 transition-colors"
            >
               <div className="h-full flex flex-col justify-between">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Seamless Scheduling</h3>
                  <p className="text-muted-foreground">Connect calendars and book virtual meetings instantly.</p>
                </div>
              </div>
            </motion.div>

            {/* Bento Box 4 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="md:col-span-2 relative overflow-hidden rounded-3xl border border-border/50 bg-card/50 p-8 hover:bg-card/80 transition-colors"
            >
              <div className="absolute right-0 bottom-0 opacity-5 w-full h-full bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
               <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <Activity className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Zero Patient Data</h3>
                  <p className="text-muted-foreground text-lg max-w-md">We facilitate the connection, not the data transfer. Ensuring 100% HIPAA and GDPR compliance for initial contact.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 py-24 md:py-32 border-y border-border/40">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl mb-6">
              Three steps to your next breakthrough
            </h2>
            <p className="text-lg text-muted-foreground">
              A streamlined workflow designed specifically for the unique needs of healthcare and engineering professionals.
            </p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid gap-8 md:grid-cols-3 relative"
          >
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-24 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -z-10" />

            {howItWorks.map((item, idx) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                className="group relative flex flex-col items-center text-center rounded-3xl bg-background p-8 border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-background border border-border shadow-lg z-10 group-hover:border-primary/50 transition-colors">
                  <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
                    {item.step}
                  </div>
                </div>
                
                <h3 className="mb-4 text-xl font-bold">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-3xl bg-gradient-to-br from-primary to-accent p-1">
            <div className="rounded-[23px] bg-background/95 backdrop-blur-xl px-8 py-16">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center justify-center">
                    <span className="text-4xl md:text-5xl font-black bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent mb-2">
                      {stat.value}
                    </span>
                    <span className="text-sm md:text-base font-medium text-muted-foreground uppercase tracking-wider">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-24 md:py-32 bg-muted/10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 md:flex justify-between items-end">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl mb-4">Who is Health AI for?</h2>
              <p className="text-lg text-muted-foreground">Tailored experiences for every stakeholder in the health-tech ecosystem.</p>
            </div>
            <Button variant="ghost" className="hidden md:flex mt-4 group">
              View all use cases <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {roles.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group rounded-3xl border border-border/60 bg-card p-8 hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
              >
                <div className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color}`}>
                  <item.icon className={`h-8 w-8 ${item.textColor}`} />
                </div>
                <h3 className="mb-4 text-2xl font-bold">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & CTA */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-50" />
        
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mx-auto mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent shadow-2xl"
          >
            <Lock className="h-10 w-10 text-primary-foreground" />
          </motion.div>
          
          <h2 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">Ready to shape the future?</h2>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground">
            Join the most secure and effective co-creation platform. No patient data is ever shared on the platform. We strictly facilitate the connection.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Button size="lg" className="h-14 rounded-full px-10 text-lg shadow-xl" onClick={() => navigate("/register")}>
              Create Free Account
            </Button>
            <Button variant="outline" size="lg" className="h-14 rounded-full px-10 text-lg bg-background/50 backdrop-blur" onClick={() => navigate("/login")}>
              Contact Sales
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
            {["HIPAA Compliant Setup", "End-to-End Encryption", "Verified Professionals"].map(
              (label) => (
                <div key={label} className="flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-4 py-2 backdrop-blur shadow-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  {label}
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Activity className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold tracking-tight">Health AI</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A structured partner-discovery platform for healthcare innovation. Bridging the gap between clinical needs and engineering capabilities.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">How it works</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">For Engineers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">For Healthcare</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-1">Documentation <ArrowUpRight className="h-3 w-3" /></a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Case Studies</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Data Processing Addendum</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
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

