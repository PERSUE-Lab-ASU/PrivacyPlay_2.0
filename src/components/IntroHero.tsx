import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function IntroHero({ onStart }: { onStart?: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-slate-950">
      {/* Subtle mesh gradient */}
      <motion.div
        aria-hidden
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-30"
        style={{ background: "radial-gradient(circle, #4f46e5 0%, transparent 60%)" }}
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full blur-3xl opacity-30"
        style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 60%)" }}
        animate={{ x: [0, -80, 0], y: [0, -30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute top-1/3 left-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
        style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 60%)" }}
        animate={{ x: [-100, 100, -100], y: [-50, 50, -50] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Grid overlay */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating particles */}
      {mounted &&
        Array.from({ length: 24 }).map((_, i) => {
          const left = (i * 37) % 100;
          const top = (i * 53) % 100;
          const dur = 6 + (i % 5) * 1.5;
          return (
            <motion.span
              key={i}
              aria-hidden
              className="absolute w-1.5 h-1.5 rounded-full bg-white/50"
              style={{ left: `${left}%`, top: `${top}%` }}
              animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: dur, repeat: Infinity, delay: (i % 7) * 0.4, ease: "easeInOut" }}
            />
          );
        })}

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <motion.div
          initial={{ opacity: 0, letterSpacing: "0.4em" }}
          animate={{ opacity: 0.7, letterSpacing: "0.6em" }}
          transition={{ duration: 1.2, delay: 0.1 }}
          className="text-xs md:text-sm uppercase text-indigo-300/80 mb-6"
        >
          An interactive field guide
        </motion.div>

        <h1 className="flex justify-center gap-1 md:gap-2 font-serif text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight">
          {"PrivacyPlay".split("").map((ch, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 40, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.7, delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #818cf8 0%, #60a5fa 50%, #c7d2fe 100%)",
              }}
            >
              {ch}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.5 }}
          className="mt-8 max-w-xl mx-auto text-lg md:text-xl text-slate-300/90 leading-relaxed"
        >
          A visual journey into differential privacy — where data whispers,
          noise defends, and every count tells a story.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2 }}
          className="mt-12 flex flex-col items-center gap-4"
        >
          <button
            onClick={onStart}
            className="group relative px-8 py-3 rounded-full text-sm uppercase tracking-widest font-semibold text-slate-950 bg-white hover:bg-indigo-50 transition-all hover:scale-105"
          >
            Begin the journey
          </button>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-slate-400/70 text-xs uppercase tracking-widest mt-4"
          >
            ↓ Scroll to start
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

