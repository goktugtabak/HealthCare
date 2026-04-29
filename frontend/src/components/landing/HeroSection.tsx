import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroScene = lazy(() => import("@/components/three/HeroScene"));

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: delay as number, ease: [0.22, 1, 0.36, 1] },
  }),
};

export const HeroSection = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative mx-auto max-w-7xl px-6 pt-32 pb-24 md:pt-40 md:pb-32 lg:min-h-screen lg:flex lg:items-center">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8 w-full">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative z-10 max-w-2xl"
        >
          {/* Enhanced Tag */}
          <motion.div
            variants={fadeUp}
            custom={0}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)] backdrop-blur-md"
          >
            <Sparkles className="h-4 w-4" />
            <span>The bridge between medicine and code</span>
          </motion.div>
          
          {/* Enhanced Typography */}
          <motion.h1
            variants={fadeUp}
            custom={0.1}
            className="text-5xl font-extrabold tracking-tighter md:text-7xl lg:text-[6rem] leading-[1.05]"
          >
            Structured <br/>
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent drop-shadow-sm">
              Co-Creation
            </span>
          </motion.h1>
          
          <motion.p
            variants={fadeUp}
            custom={0.2}
            className="mt-6 max-w-xl text-lg text-muted-foreground/90 md:text-xl leading-relaxed font-light"
          >
            Connect brilliant engineers with visionary healthcare professionals through secure, purposeful first contact. Build the next generation of health-tech together.
          </motion.p>
          
          <motion.div
            variants={fadeUp}
            custom={0.3}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <Button size="lg" className="h-14 rounded-full px-8 text-base shadow-xl shadow-primary/20 group hover:shadow-primary/40 transition-all duration-300" onClick={() => navigate("/register")}>
              Start Collaborating
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-2" />
            </Button>
            <Button variant="outline" size="lg" className="h-14 rounded-full px-8 text-base border-border/60 bg-background/50 backdrop-blur-md hover:bg-accent/10 hover:border-accent/30 transition-all duration-300" onClick={() => navigate("/login")}>
              Explore Projects
            </Button>
          </motion.div>
          
          {/* Avatar Group Enhancement */}
          <motion.div
            variants={fadeUp}
            custom={0.4}
            className="mt-12 flex items-center gap-4 text-sm text-muted-foreground"
          >
            <div className="flex -space-x-3">
              {[1,2,3,4].map((i) => (
                <div key={i} className="h-12 w-12 rounded-full border-[3px] border-background bg-muted flex items-center justify-center overflow-hidden shadow-sm">
                  <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <span className="text-foreground font-semibold">2,500+ innovators</span>
              <span className="text-xs">already joined the platform</span>
            </div>
          </motion.div>
        </motion.div>

        {/* 3D Scene Container */}
        <div className="relative h-[400px] w-full md:h-[600px] lg:h-[700px]">
          {/* Ambient Glow behind 3D object */}
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[80%] w-[80%] rounded-full bg-gradient-to-tr from-primary/30 to-accent/30 blur-[120px] -z-10"
          />
          {!reduceMotion && (
            <Suspense fallback={<div className="h-full w-full animate-pulse rounded-3xl bg-card/40 border border-border/10" />}>
              <HeroScene />
            </Suspense>
          )}
        </div>
      </div>
    </section>
  );
};
