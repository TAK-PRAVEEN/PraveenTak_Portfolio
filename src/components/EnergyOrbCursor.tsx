/**
 * EnergyOrbCursor.tsx
 * ------------------------------------------------------------------
 * "AI Energy Orb" custom cursor:
 *   • 12px glowing sphere — dark-blue core, purple outer glow, soft bloom
 *   • tiny orbiting particles around the orb
 *   • smooth interpolation lag; gentle pulse while idle
 *   • fading particle trail while moving
 *   • hover effects:
 *       button/link → orb compresses into a ring
 *       card        → emits an expanding ripple
 *       portrait    → orbit tightens + nearby particles get attracted in
 *
 * Canvas overlay, pointer-events: none (native cursor hidden globally).
 * Alternatives kept for comparison: NeuralCursor.tsx, CustomCursor.tsx.
 * ------------------------------------------------------------------
 */
import { useEffect, useRef } from "react";

const ORB_R = 6; // core radius (≈12px sphere)
const GLOW_R = 26; // bloom radius
const ORBITERS = 5; // tiny orbiting particles
const TRAIL_MAX = 90;

const SEL_BUTTON = 'a, button, [role="button"], input, textarea, select, label';
const SEL_CARD = '[data-cursor="card"], .corner-lights';
const SEL_PORTRAIT = '[data-cursor="portrait"]';

type Mode = "none" | "button" | "card" | "portrait";

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 1 → 0
  size: number;
  attract: boolean; // true = gets pulled into the orb (portrait mode)
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  alpha: number;
}

const EnergyOrbCursor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -100, y: -100 };
    const orb = { x: -100, y: -100 };
    let mode: Mode = "none";
    let lastMove = 0;
    let t = 0;

    const sparks: Spark[] = [];
    const ripples: Ripple[] = [];
    const orbiters = Array.from({ length: ORBITERS }, (_, i) => ({
      angle: (i / ORBITERS) * Math.PI * 2,
      speed: 1.2 + Math.random() * 1.4,
      r: 11 + Math.random() * 7,
      size: 1 + Math.random() * 0.8,
    }));

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      lastMove = performance.now();
    };

    const onOver = (e: Event) => {
      const el = e.target as Element | null;
      if (!el?.closest) return;
      const next: Mode = el.closest(SEL_PORTRAIT)
        ? "portrait"
        : el.closest(SEL_BUTTON)
          ? "button"
          : el.closest(SEL_CARD)
            ? "card"
            : "none";
      // Entering a card emits a single ripple from the orb.
      if (next === "card" && mode !== "card") {
        ripples.push({ x: orb.x, y: orb.y, r: ORB_R + 2, alpha: 0.45 });
      }
      mode = next;
    };

    const tick = () => {
      t += 0.016;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      // --- Smooth interpolation lag -----------------------------------
      const prevX = orb.x;
      const prevY = orb.y;
      orb.x += (mouse.x - orb.x) * 0.18;
      orb.y += (mouse.y - orb.y) * 0.18;
      const speed = Math.hypot(orb.x - prevX, orb.y - prevY);

      // --- Idle pulse + hover expansion --------------------------------
      const idle = performance.now() - lastMove > 250;
      const pulse = 1 + (idle ? 0.12 : 0.04) * Math.sin(t * 2.6);
      const hoverScale = mode !== "none" ? 1.25 : 1;
      const R = ORB_R * pulse * hoverScale;

      // --- Fading particle trail (spawn while moving) -------------------
      if (speed > 1.2 && sparks.length < TRAIL_MAX) {
        const n = Math.min(2, Math.ceil(speed / 6));
        for (let i = 0; i < n; i++) {
          sparks.push({
            x: orb.x + (Math.random() - 0.5) * 6,
            y: orb.y + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            life: 1,
            size: 1 + Math.random() * 1.6,
            attract: false,
          });
        }
      }
      // Portrait mode: spawn particles around the orb that get SUCKED IN.
      if (mode === "portrait" && sparks.length < TRAIL_MAX) {
        const a = Math.random() * Math.PI * 2;
        const d = 40 + Math.random() * 30;
        sparks.push({
          x: orb.x + Math.cos(a) * d,
          y: orb.y + Math.sin(a) * d,
          vx: 0,
          vy: 0,
          life: 1,
          size: 1 + Math.random() * 1.2,
          attract: true,
        });
      }

      // --- Draw with additive blending for the bloom feel ---------------
      ctx.globalCompositeOperation = "lighter";

      // Ripples (card hover)
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 2.4;
        rp.alpha *= 0.94;
        if (rp.alpha < 0.02) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(139, 92, 246, ${rp.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Trail / attracted sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        if (s.attract) {
          // Pulled toward the orb, fading as it arrives.
          s.vx += (orb.x - s.x) * 0.02;
          s.vy += (orb.y - s.y) * 0.02;
          s.vx *= 0.9;
          s.vy *= 0.9;
          s.life -= 0.02;
          if (Math.hypot(orb.x - s.x, orb.y - s.y) < R + 2) s.life -= 0.15;
        } else {
          s.life -= 0.035;
        }
        s.x += s.vx;
        s.y += s.vy;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.fillStyle = `rgba(154, 120, 255, ${0.5 * s.life})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        ctx.fill();
      }

      // Soft purple bloom
      const bloomR = GLOW_R * pulse * hoverScale;
      const bloom = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, bloomR);
      bloom.addColorStop(0, "rgba(139, 92, 246, 0.30)");
      bloom.addColorStop(0.6, "rgba(139, 92, 246, 0.12)");
      bloom.addColorStop(1, "rgba(139, 92, 246, 0)");
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, bloomR, 0, Math.PI * 2);
      ctx.fill();

      // Tiny orbiting particles (tighter + faster over the portrait)
      const orbitScale = mode === "portrait" ? 0.55 : 1;
      const orbitBoost = mode === "portrait" ? 1.8 : 1;
      for (const o of orbiters) {
        o.angle += o.speed * orbitBoost * 0.016;
        const ox = orb.x + Math.cos(o.angle) * o.r * orbitScale * hoverScale;
        const oy = orb.y + Math.sin(o.angle) * o.r * orbitScale * hoverScale;
        ctx.fillStyle = "rgba(170, 190, 255, 0.85)";
        ctx.beginPath();
        ctx.arc(ox, oy, o.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";

      // --- The orb itself ------------------------------------------------
      if (mode === "button") {
        // Compress into a hollow ring over buttons/links.
        ctx.strokeStyle = "rgba(154, 130, 255, 0.95)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, R + 4, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Glowing sphere: dark-blue core → purple edge.
        const core = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, R);
        core.addColorStop(0, "rgba(80, 110, 235, 1)");
        core.addColorStop(0.55, "rgba(24, 38, 105, 0.95)");
        core.addColorStop(1, "rgba(120, 90, 240, 0.55)");
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, R, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, true);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver, true);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999]"
    />
  );
};

export default EnergyOrbCursor;
