/**
 * AIScrollbar.tsx
 * ------------------------------------------------------------------
 * Interactive "AI" scrollbar replacing the native one (hidden in CSS):
 *   • 3px dark-glass track, purple→blue glowing gradient thumb,
 *   • while scrolling: glow intensifies, the beam STRETCHES with speed,
 *     and particles fly upward off the thumb,
 *   • on stop: particles return to the thumb, the beam shrinks back,
 *     and the glow settles into a slow idle pulse,
 *   • hover: thumb grows wider and more luminous (draggable, and the
 *     track is click-to-jump),
 *   • reaching the bottom emits a ripple — "AI finished processing".
 *
 * DOM thumb/track for crisp gradient + glow; a slim canvas strip on the
 * right edge draws the particles and ripples. All animation on rAF refs
 * (no React re-renders).
 * ------------------------------------------------------------------
 */
import { useEffect, useRef } from "react";

const TRACK_MARGIN = 8; // inset from top/bottom (px)
const W_REST = 4; // thumb width at rest
const W_HOVER = 8; // thumb width on hover/drag
const TRACK_CENTER = 6.5; // px from the right edge to the track centre
const CANVAS_W = 90; // particle strip width

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface Ripple {
  y: number;
  r: number;
  alpha: number;
}

const AIScrollbar = () => {
  const thumbRef = useRef<HTMLDivElement>(null);
  const hitRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const thumb = thumbRef.current;
    const hit = hitRef.current;
    const canvas = canvasRef.current;
    if (!thumb || !hit || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let lastY = window.scrollY;
    let vel = 0;
    let energy = 0; // 0 idle … 1 scrolling fast
    let hovering = false;
    let dragging = false;
    let dragOffset = 0;
    let bottomFired = false;
    let t = 0;

    const sparks: Spark[] = [];
    const ripples: Ripple[] = [];

    const resize = () => {
      canvas.width = CANVAS_W * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${CANVAS_W}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const metrics = () => {
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      const trackH = window.innerHeight - TRACK_MARGIN * 2;
      const baseH = Math.max(36, (window.innerHeight / doc.scrollHeight) * trackH);
      return { max, trackH, baseH };
    };

    // --- Drag / click-to-jump ------------------------------------------
    const moveTo = (clientY: number) => {
      const { max, trackH, baseH } = metrics();
      const frac = Math.min(
        1,
        Math.max(0, (clientY - dragOffset - TRACK_MARGIN) / Math.max(1, trackH - baseH)),
      );
      window.scrollTo({ top: frac * max });
    };
    const onPointerMove = (e: PointerEvent) => {
      if (dragging) moveTo(e.clientY);
    };
    const onPointerUp = () => {
      dragging = false;
      window.removeEventListener("pointermove", onPointerMove);
    };
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      const { max, trackH, baseH } = metrics();
      const thumbTop = TRACK_MARGIN + (window.scrollY / max) * (trackH - baseH);
      const within = e.clientY >= thumbTop && e.clientY <= thumbTop + baseH;
      dragOffset = within ? e.clientY - thumbTop : baseH / 2;
      dragging = true;
      if (!within) moveTo(e.clientY); // click on track → jump
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp, { once: true });
    };
    const onEnter = () => (hovering = true);
    const onLeave = () => (hovering = false);

    // --- Frame loop ------------------------------------------------------
    const tick = () => {
      t += 0.016;
      const { max, trackH, baseH } = metrics();
      const y = window.scrollY;
      vel += (Math.abs(y - lastY) - vel) * 0.2;
      lastY = y;
      energy += (Math.min(1, vel / 30) - energy) * 0.12;

      // Beam stretches with scroll speed, shrinks back on stop.
      const stretch = energy * 34;
      const h = baseH + stretch;
      const top = TRACK_MARGIN + (y / max) * (trackH - baseH) - stretch / 2;
      const width = hovering || dragging ? W_HOVER : W_REST;

      // Idle → slow glow pulse; scrolling → glow scales with energy.
      const pulse = energy < 0.05 ? 0.65 + 0.35 * Math.sin(t * 2.2) : 1;
      const glowA = (0.35 + energy * 0.55 + (hovering || dragging ? 0.18 : 0)) * pulse;
      const glowR = (6 + energy * 18 + (hovering || dragging ? 6 : 0)) * pulse;

      thumb.style.top = `${top}px`;
      thumb.style.height = `${h}px`;
      thumb.style.width = `${width}px`;
      thumb.style.right = `${TRACK_CENTER - width / 2}px`;
      thumb.style.opacity = `${0.75 + energy * 0.25}`;
      thumb.style.boxShadow =
        `0 0 ${glowR}px rgba(139, 92, 246, ${glowA}), ` +
        `0 0 ${glowR * 2}px rgba(59, 130, 246, ${glowA * 0.6})`;

      // Thumb centre in canvas coordinates.
      const cx = CANVAS_W - TRACK_CENTER;
      const cy = top + h / 2;

      // While scrolling: particles fly upward off the beam.
      if (energy > 0.12 && sparks.length < 70) {
        for (let i = 0; i < Math.ceil(energy * 3); i++) {
          sparks.push({
            x: cx + (Math.random() - 0.5) * 6,
            y: cy + (Math.random() - 0.5) * h * 0.6,
            vx: -(0.3 + Math.random() * 1.2),
            vy: -(0.8 + Math.random() * 1.8), // upward
            life: 1,
          });
        }
      }

      // Bottom of page → single ripple ("processing complete").
      const atBottom = y >= max - 2;
      if (atBottom && !bottomFired) {
        bottomFired = true;
        ripples.push({ y: cy, r: 4, alpha: 0.6 });
      } else if (!atBottom && y < max - 120) {
        bottomFired = false;
      }

      // --- Canvas: particles + ripples --------------------------------
      ctx.clearRect(0, 0, CANVAS_W, window.innerHeight);
      ctx.globalCompositeOperation = "lighter";

      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 2.6;
        rp.alpha *= 0.93;
        if (rp.alpha < 0.02) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(139, 92, 246, ${rp.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      const idle = energy < 0.08;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        if (idle) {
          // Scrolling stopped → particles return to the thumb and dissolve.
          s.vx += (cx - s.x) * 0.015;
          s.vy += (cy - s.y) * 0.015;
          s.vx *= 0.88;
          s.vy *= 0.88;
          s.life -= 0.02;
          if (Math.hypot(cx - s.x, cy - s.y) < 8) s.life -= 0.12;
        } else {
          s.life -= 0.018;
        }
        s.x += s.vx;
        s.y += s.vy;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.fillStyle = `rgba(150, 140, 255, ${0.55 * s.life})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.4 * s.life + 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    hit.addEventListener("pointerenter", onEnter);
    hit.addEventListener("pointerleave", onLeave);
    hit.addEventListener("pointerdown", onPointerDown);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      hit.removeEventListener("pointerenter", onEnter);
      hit.removeEventListener("pointerleave", onLeave);
      hit.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <>
      {/* Particle / ripple strip (behind the thumb, no pointer events) */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed right-0 top-0 z-[94]"
      />

      {/* Wider invisible hit area → easy hover/drag on a 3px bar */}
      <div ref={hitRef} className="fixed bottom-0 right-0 top-0 z-[95] w-4">
        {/* Dark-glass track */}
        <div className="absolute bottom-2 top-2 right-[5px] w-[3px] rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm" />
        {/* Glowing AI-core thumb (purple → blue) */}
        <div
          ref={thumbRef}
          className="absolute rounded-full transition-[width] duration-200"
          style={{ background: "linear-gradient(180deg, #8B5CF6 0%, #3B82F6 100%)" }}
        />
      </div>
    </>
  );
};

export default AIScrollbar;
