/**
 * ParticleLoader.tsx
 * ------------------------------------------------------------------
 * Slot-filling "processing" loader for the particle portrait. Fills its
 * nearest relative parent (position: absolute inset-0) and shows the
 * animated Name.gif on a frosted-glass panel — used instead of ever
 * flashing the raw source photo while the portrait is loading/sampling.
 * ------------------------------------------------------------------
 */
import { motion } from "framer-motion";

const ParticleLoader = () => (
  <div className="absolute inset-0 z-20 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-black/40 px-8 py-6 backdrop-blur-2xl">
      <img
        src={`${import.meta.env.BASE_URL}Name.gif`}
        alt="Loading"
        className="h-16 max-w-full object-contain md:h-20"
      />
      <div className="h-1 w-32 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary to-secondary"
          animate={{ x: ["-120%", "320%"] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  </div>
);

export default ParticleLoader;
