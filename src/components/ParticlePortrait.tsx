/**
 * ParticlePortrait.tsx
 * ------------------------------------------------------------------
 * Drop-in replacement for the static profile <img>. Renders a live,
 * GPU particle reconstruction of the portrait inside an R3F <Canvas>.
 *
 * Responsibilities (kept out of the WebGL layers so they stay pure):
 *   • pick a device tier → particle budget + DPR cap,
 *   • sample the source image into a point cloud (async, off the GPU),
 *   • reveal on scroll-into-view + fade the canvas in (framer-motion),
 *   • pause the render loop while off-screen (battery),
 *   • fall back to the plain <img> on WebGL failure, load error, or
 *     when the user prefers reduced motion.
 * ------------------------------------------------------------------
 */
import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";
import ParticleField from "./particles/ParticleField";
import { detectDeviceTier, TIER_CONFIG } from "./particles/config";
import { sampleImage, type SampledParticles } from "@/lib/particles/sampleImage";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import ParticleLoader from "@/components/ParticleLoader";
import { cn } from "@/lib/utils";

interface ParticlePortraitProps {
  /** Image URL to reconstruct (e.g. `${import.meta.env.BASE_URL}portrait.png`). */
  src: string;
  /** Sizing classes for the wrapper (e.g. "w-full max-w-[720px] aspect-[3/4]"). */
  className?: string;
  alt?: string;
  /** Optional particle-count override (defaults to the device tier's budget). */
  count?: number;
}

/** Respect the OS "reduce motion" setting. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

const ParticlePortrait = ({ src, className, alt = "Praveen Tak", count }: ParticlePortraitProps) => {
  // Re-triggerable observer: also used to pause the loop off-screen.
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.2, triggerOnce: false });

  const tier = useMemo(() => detectDeviceTier(), []);
  const cfg = TIER_CONFIG[tier];
  const reducedMotion = usePrefersReducedMotion();

  const [data, setData] = useState<SampledParticles | null>(null);
  const [failed, setFailed] = useState(false);

  const targetCount = count ?? cfg.particleTarget;

  // Sample the image into a point cloud once (skip entirely if reduced motion).
  useEffect(() => {
    if (reducedMotion) return;
    let cancelled = false;
    sampleImage(src, { targetCount })
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [src, targetCount, reducedMotion]);

  // --- Graceful fallback: static image --------------------------------
  if (reducedMotion || failed) {
    return (
      <div ref={elementRef} className={cn("relative", className)}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full rounded-2xl object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  // --- Live particle portrait -----------------------------------------
  return (
    <div ref={elementRef} data-cursor="portrait" className={cn("relative", className)}>
      {/* Soft ambient glow behind the canvas (theme tokens, CSS). */}
      <div className="particle-portrait-glow" aria-hidden />

      <motion.div
        className="absolute inset-0 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: data ? 1 : 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        {data && (
          <Canvas
            gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
            dpr={[1, cfg.dprCap]}
            camera={{ fov: 50, position: [0, 0, 0.8], near: 0.1, far: 10 }}
            // Pause the render loop entirely while scrolled away.
            frameloop={isVisible ? "always" : "never"}
          >
            <ParticleField
              data={data}
              inView={isVisible}
              emitterCount={cfg.emitterCount}
              depthCount={cfg.depthCount}
              pointSize={cfg.pointSize}
              glow={cfg.glow}
            />
          </Canvas>
        )}
      </motion.div>

      {/* While the point cloud is still sampling, show the Name.gif
          processing loader — never flash the raw source photo. */}
      {!data && <ParticleLoader />}

      {/* Accessible name / SEO — visually hidden, no layout impact. */}
      <img src={src} alt={alt} className="sr-only" />
    </div>
  );
};

export default ParticlePortrait;
