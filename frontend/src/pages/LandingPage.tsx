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
} from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroScene = lazy(() => import("@/components/three/HeroScene"));

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

const howItWorks = [
  {
    step: "1",
    title: "Post Your Need",
    desc: "Describe your project, required expertise, and collaboration preferences.",
    icon: Users,
  },
  {
    step: "2",
    title: "Discover & Match",
    desc: "Browse posts, filter by domain and city, and find the right interdisciplinary partner.",
    icon: Calendar,
  },
  {
    step: "3",
    title: "Schedule & Connect",
    desc: "Request a meeting, accept NDA terms, and schedule your first external conversation.",
    icon: CheckCircle,
  },
];

const roles = [
  {
    icon: Cpu,
    title: "Engineers",
    desc: "Find clinical partners who understand patient needs. Validate your health-tech prototypes with real domain experts.",
  },
  {
    icon: Stethoscope,
    title: "Healthcare Professionals",
    desc: "Connect with engineers who can build the tools you envision. Share your clinical insights securely.",
  },
  {
    icon: Shield,
    title: "Administrators",
    desc: "Oversee platform activity, manage users and posts, and ensure compliance with institutional policies.",
  },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 85% 10%, hsl(175 50% 70% / 0.18), transparent 70%), radial-gradient(55% 45% at 10% 30%, hsl(215 60% 55% / 0.18), transparent 70%), radial-gradient(70% 50% at 50% 100%, hsl(175 40% 60% / 0.10), transparent 75%)",
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/70 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="text-lg font-semibold tracking-tight">Health AI</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Log In
            </Button>
            <Button size="sm" onClick={() => navigate("/register")}>
              Register
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="relative z-10"
          >
            <motion.span
              variants={fadeUp}
              custom={0}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Secure first contact · No patient data
            </motion.span>
            <motion.h1
              variants={fadeUp}
              custom={0.05}
              className="text-4xl font-bold tracking-tight md:text-6xl"
            >
              Structured Co-Creation for{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Healthcare Innovation
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={0.15}
              className="mt-5 max-w-xl text-lg text-muted-foreground"
            >
              Connect engineers and healthcare professionals through secure, purposeful first
              contact. Post opportunities, discover expertise, schedule external meetings, close
              the match.
            </motion.p>
            <motion.div
              variants={fadeUp}
              custom={0.25}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Button size="lg" onClick={() => navigate("/register")} className="group">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/login")}>
                Log In
              </Button>
            </motion.div>
            <motion.div
              variants={fadeUp}
              custom={0.35}
              className="mt-8 flex flex-wrap gap-4 text-xs text-muted-foreground"
            >
              <span className="rounded-full border border-border/70 bg-card/50 px-3 py-1 backdrop-blur">
                GDPR Compliant
              </span>
              <span className="rounded-full border border-border/70 bg-card/50 px-3 py-1 backdrop-blur">
                NDA Workflow
              </span>
              <span className="rounded-full border border-border/70 bg-card/50 px-3 py-1 backdrop-blur">
                Institutional Trust
              </span>
            </motion.div>
          </motion.div>

          <div className="relative h-[360px] md:h-[520px]">
            <div
              aria-hidden
              className="absolute inset-8 -z-10 rounded-full bg-accent/20 blur-3xl"
            />
            {!reduceMotion && (
              <Suspense fallback={<div className="h-full w-full animate-pulse rounded-3xl bg-card/40" />}>
                <HeroScene />
              </Suspense>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-border/60 bg-card/60 py-20 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center text-3xl font-semibold tracking-tight"
          >
            How It Works
          </motion.h2>
          <div className="grid gap-8 md:grid-cols-3">
            {howItWorks.map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -6 }}
                className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-7 shadow-sm transition-shadow hover:shadow-lg"
              >
                <div
                  aria-hidden
                  className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/10 blur-2xl transition-all duration-500 group-hover:bg-accent/20"
                />
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-base font-semibold text-primary-foreground shadow-md">
                  {item.step}
                </div>
                <item.icon className="mb-3 h-5 w-5 text-accent" />
                <h3 className="mb-2 text-base font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center text-3xl font-semibold tracking-tight"
          >
            Who Is This For?
          </motion.h2>
          <div className="grid gap-6 md:grid-cols-3">
            {roles.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="rounded-2xl border border-border/70 bg-card/80 p-6 backdrop-blur transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-base font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-y border-border/60 bg-card/60 py-20 backdrop-blur">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg"
          >
            <Lock className="h-6 w-6 text-primary-foreground" />
          </motion.div>
          <h2 className="mb-3 text-3xl font-semibold tracking-tight">Built on Trust &amp; Privacy</h2>
          <p className="mx-auto mb-6 max-w-xl text-sm text-muted-foreground">
            This platform facilitates first contact only. No patient data should be uploaded or
            shared. Share only what is needed. Discuss sensitive details during the meeting and
            continue externally after the intro call.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
            {["GDPR Compliant", "No Patient Data", "NDA Workflow", "Institutional Trust Signal"].map(
              (label) => (
                <span
                  key={label}
                  className="rounded-full border border-border/70 bg-background/60 px-3 py-1 backdrop-blur"
                >
                  {label}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-muted-foreground">
        <p>© 2025 Health AI Co-Creation &amp; Innovation Platform. All rights reserved.</p>
        <p className="mt-1">A structured partner-discovery platform for healthcare innovation.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
