/**
 * PageLoader.tsx
 * ------------------------------------------------------------------
 * Full-screen loader shown while a page is opening / a route chunk is
 * loading. Used both as the Suspense fallback for lazy routes AND as a
 * short guaranteed loader on every navigation (see App.tsx).
 *
 * The animated Name.gif sits on a frosted-glass panel over a blurred
 * backdrop, so the page behind shows through as a soft glass effect.
 * ------------------------------------------------------------------
 */
import { motion } from "framer-motion";

const PageLoader = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.25, ease: "easeOut" }}
    className="fixed inset-0 z-[100] flex items-center justify-center"
  >
    {/* Frosted-glass blur over whatever is currently behind */}
    <div className="absolute inset-0 bg-background/40 backdrop-blur-xl" />

    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative z-10 flex flex-col items-center gap-5 rounded-3xl border border-white/10 bg-black/40 px-10 py-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
    >
      {/* Animated name logo */}
      <img
        src={`${import.meta.env.BASE_URL}Name.gif`}
        alt="Loading"
        className="h-20 max-w-full object-contain md:h-24"
      />

      {/* Fast indeterminate progress shimmer */}
      <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary to-secondary"
          animate={{ x: ["-120%", "320%"] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  </motion.div>
);

export default PageLoader;
