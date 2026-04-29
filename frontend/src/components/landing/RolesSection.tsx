import { motion } from "framer-motion";
import { Cpu, Stethoscope, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const roles = [
  {
    icon: Cpu,
    title: "Engineers & Developers",
    desc: "Find clinical partners who understand patient needs. Validate your health-tech prototypes with real domain experts before writing a single line of code.",
    color: "from-blue-500/20 to-indigo-500/20",
    textColor: "text-indigo-400",
    hoverBorder: "hover:border-indigo-500/50"
  },
  {
    icon: Stethoscope,
    title: "Healthcare Professionals",
    desc: "Connect with engineers who can build the tools you envision. Share your clinical insights securely to shape the future of medical technology.",
    color: "from-teal-500/20 to-emerald-500/20",
    textColor: "text-teal-400",
    hoverBorder: "hover:border-teal-500/50"
  },
  {
    icon: Shield,
    title: "Administrators",
    desc: "Oversee platform activity, manage users and posts, and ensure strict compliance with institutional policies and data governance.",
    color: "from-orange-500/20 to-red-500/20",
    textColor: "text-orange-400",
    hoverBorder: "hover:border-orange-500/50"
  },
];

export const RolesSection = () => {
  return (
    <section className="py-24 md:py-32 bg-background relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 md:flex justify-between items-end">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl mb-4">Who is Health AI for?</h2>
            <p className="text-lg text-muted-foreground/80 font-light">Tailored experiences for every stakeholder in the health-tech ecosystem.</p>
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
              className={`group rounded-3xl border border-white/5 bg-card/30 p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 backdrop-blur-sm ${item.hoverBorder}`}
            >
              <div className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                <item.icon className={`h-8 w-8 ${item.textColor}`} />
              </div>
              <h3 className="mb-4 text-2xl font-bold tracking-tight">{item.title}</h3>
              <p className="text-muted-foreground font-light leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
