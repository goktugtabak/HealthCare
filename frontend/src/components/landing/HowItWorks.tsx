import { motion } from "framer-motion";
import { Users, Calendar, CheckCircle } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
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

export const HowItWorks = () => {
  return (
    <section className="bg-muted/30 py-24 md:py-32 border-y border-border/40 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[100px] -z-10" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl mb-6">
            Three steps to your next <span className="text-primary">breakthrough</span>
          </h2>
          <p className="text-lg text-muted-foreground/80 font-light leading-relaxed">
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
          <div className="hidden md:block absolute top-24 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-transparent via-border/80 to-transparent -z-10" />

          {howItWorks.map((item) => (
            <motion.div
              key={item.step}
              variants={fadeUp}
              className="group relative flex flex-col items-center text-center rounded-3xl bg-background/50 backdrop-blur-sm p-10 border border-white/5 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all duration-500 hover:-translate-y-2"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-card border border-white/10 shadow-lg z-10 group-hover:scale-110 group-hover:border-primary/30 transition-all duration-500">
                <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-background">
                  {item.step}
                </div>
              </div>
              
              <h3 className="mb-4 text-2xl font-bold tracking-tight">{item.title}</h3>
              <p className="text-muted-foreground font-light leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
