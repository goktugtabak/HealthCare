import { motion } from "framer-motion";
import { Users, Shield, Calendar, Activity, Network } from "lucide-react";

export const FeaturesBento = () => {
  return (
    <section className="py-24 md:py-32 relative">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl mb-4">
            Everything you need to <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">innovate.</span>
          </h2>
          <p className="text-lg text-muted-foreground/80 font-light">
            We've built a comprehensive ecosystem that removes the friction from interdisciplinary collaboration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[340px]">
          {/* Bento Box 1 */}
          <motion.article 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 p-8 hover:bg-card/60 hover:shadow-2xl transition-all duration-500 backdrop-blur-xl group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110">
              <Network className="w-64 h-64 text-primary" />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-inner ring-1 ring-white/10 group-hover:scale-105 transition-transform">
                <Users className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h3 className="text-3xl font-bold mb-3 tracking-tight">Smart Matchmaking</h3>
                <p className="text-muted-foreground text-lg leading-relaxed font-light">
                  Our algorithm pairs engineering capabilities with specific clinical needs, ensuring high-impact collaborations right from the start.
                </p>
              </div>
            </div>
          </motion.article>

          {/* Bento Box 2 */}
          <motion.article 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-accent/20 to-transparent p-8 group hover:shadow-2xl hover:border-accent/30 transition-all duration-500 backdrop-blur-md"
          >
            <div className="h-full flex flex-col justify-between">
              <div className="w-16 h-16 rounded-2xl bg-background/50 backdrop-blur-lg flex items-center justify-center text-accent mb-6 shadow-sm ring-1 ring-white/10 group-hover:scale-105 transition-transform">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight">NDA Integrated</h3>
                <p className="text-muted-foreground font-light leading-relaxed">
                  Built-in legal workflows protect your IP from day one. Sign and secure within seconds.
                </p>
              </div>
            </div>
          </motion.article>

          {/* Bento Box 3 */}
          <motion.article 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 p-8 hover:bg-card/60 hover:shadow-2xl transition-all duration-500 backdrop-blur-xl group"
          >
             <div className="h-full flex flex-col justify-between">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-inner ring-1 ring-white/10 group-hover:scale-105 transition-transform">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight">Seamless Scheduling</h3>
                <p className="text-muted-foreground font-light leading-relaxed">
                  Connect calendars and book virtual meetings instantly without the back-and-forth emails.
                </p>
              </div>
            </div>
          </motion.article>

          {/* Bento Box 4 */}
          <motion.article 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2 relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 p-8 hover:bg-card/60 hover:shadow-2xl transition-all duration-500 backdrop-blur-xl group"
          >
            <div className="absolute right-0 bottom-0 opacity-10 w-full h-full bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent group-hover:opacity-20 transition-opacity duration-500" />
             <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-inner ring-1 ring-white/10 group-hover:scale-105 transition-transform">
                <Activity className="w-8 h-8" />
              </div>
              <div className="max-w-lg">
                <h3 className="text-3xl font-bold mb-3 tracking-tight">Zero Patient Data</h3>
                <p className="text-muted-foreground text-lg font-light leading-relaxed">
                  We facilitate the connection, not the data transfer. Ensuring 100% HIPAA and GDPR compliance for initial contact and ideation.
                </p>
              </div>
            </div>
          </motion.article>
        </div>
      </div>
    </section>
  );
};
