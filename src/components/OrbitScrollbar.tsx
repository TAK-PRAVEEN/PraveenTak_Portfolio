/**
 * OrbitScrollbar.tsx
 * ------------------------------------------------------------------
 * "Orbit" scrollbar — very premium, very calm:
 *   • slim dark-glass track,
 *   • the thumb is a small lit PLANET (soft purple glow),
 *   • a tiny MOON continuously orbits it on a tilted path, passing
 *     behind (dim) and in front (bright) of the planet,
 *   • the assembly rides down/up the track with scroll; the moon
 *     orbits a touch faster while you scroll,
 *   • hover/drag: planet brightens and grows slightly. Draggable,
 *     click-to-jump on the track.
 *
 * Matches the Saturn cursor theme. Native scrollbar hidden in index.css.
 * (Alternative kept for comparison: AIScrollbar.tsx.)
 * ------------------------------------------------------------------
 */
import { useEffect, useRef } from "react";

const TRACK_MARGIN = 10; // inset from top/bottom (px)
const TRACK_CENTER = 6.5; // px from right edge to track centre
const CANVAS_W = 44; // drawing strip width
const PLANET_R = 6; // planet radius at rest
const ORBIT_RX = 11; // moon orbit radius (horizontal)
const ORBIT_RY = 4.2; // moon orbit (vertical) → tilted ellipse
const ORBIT_TILT = -0.45; // radians

const OrbitScrollbar = () => {
  const hitRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const hit = hitRef.current;
    const canvas = canvasRef.current;
    if (!hit || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let lastY = window.scrollY;
    let vel = 0;
    let hovering = false;
    let dragging = false;
    let dragOffset = 0;
    let moonAngle = 0;
    let t = 0;

    const resize = () => {
      canvas.width = CANVAS_W * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${CANVAS_W}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const metrics = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const top = TRACK_MARGIN + PLANET_R;
      const bottom = window.innerHeight - TRACK_MARGIN - PLANET_R;
      return { max, top, travel: Math.max(1, bottom - top) };
    };

    // --- Drag / click-to-jump -----------------------------------------
    const moveTo = (clientY: number) => {
      const { max, top, travel } = metrics();
      const frac = Math.min(1, Math.max(0, (clientY - dragOffset - top) / travel));
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
      const { max, top, travel } = metrics();
      const cy = top + (window.scrollY / max) * travel;
      const within = Math.abs(e.clientY - cy) <= PLANET_R + 10;
      dragOffset = within ? e.clientY - cy : 0;
      dragging = true;
      if (!within) moveTo(e.clientY);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp, { once: true });
    };
    const onEnter = () => (hovering = true);
    const onLeave = () => (hovering = false);

    // --- Frame loop ------------------------------------------------------
    const tick = () => {
      t += 0.016;
      const { max, top, travel } = metrics();
      const y = window.scrollY;
      vel += (Math.abs(y - lastY) - vel) * 0.2;
      lastY = y;
      const energy = Math.min(1, vel / 40);

      const active = hovering || dragging;
      const R = PLANET_R * (active ? 1.25 : 1);
      const cx = CANVAS_W - TRACK_CENTER;
      const cy = top + (y / max) * travel;

      // Moon orbits continuously; a touch faster while scrolling.
      moonAngle += (1.6 + energy * 2.4) * 0.016;
      const mx = Math.cos(moonAngle) * ORBIT_RX;
      const my = Math.sin(moonAngle) * ORBIT_RY;
      const moonX = cx + mx * Math.cos(ORBIT_TILT) - my * Math.sin(ORBIT_TILT);
      const moonY = cy + mx * Math.sin(ORBIT_TILT) + my * Math.cos(ORBIT_TILT);
      const moonFront = Math.sin(moonAngle) > 0;
      const moonR = 2 + (active ? 0.4 : 0);

      ctx.clearRect(0, 0, CANVAS_W, window.innerHeight);

      // Soft planet glow (breathes gently when idle).
      const pulse = 0.8 + 0.2 * Math.sin(t * 1.8);
      const glowR = (R * 3 + energy * 8) * pulse * (active ? 1.25 : 1);
      ctx.globalCompositeOperation = "lighter";
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      glow.addColorStop(0, `rgba(139, 92, 246, ${0.30 + energy * 0.2 + (active ? 0.12 : 0)})`);
      glow.addColorStop(1, "rgba(139, 92, 246, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      // Faint orbit path (premium detail).
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ORBIT_TILT);
      ctx.strokeStyle = `rgba(160, 180, 255, ${active ? 0.22 : 0.12})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, ORBIT_RX, ORBIT_RY, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Moon behind the planet (dim).
      const drawMoon = (alpha: number) => {
        const m = ctx.createRadialGradient(
          moonX - 0.6, moonY - 0.6, 0.2, moonX, moonY, moonR,
        );
        m.addColorStop(0, `rgba(225, 233, 255, ${alpha})`);
        m.addColorStop(1, `rgba(140, 160, 220, ${alpha * 0.7})`);
        ctx.fillStyle = m;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
        ctx.fill();
      };
      if (!moonFront) drawMoon(0.45);

      // The planet — lit sphere (bright top-left → deep blue edge).
      const ball = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.15, cx, cy, R);
      ball.addColorStop(0, "rgba(226, 236, 255, 1)");
      ball.addColorStop(0.5, "rgba(124, 152, 240, 0.98)");
      ball.addColorStop(1, "rgba(40, 58, 138, 0.95)");
      ctx.fillStyle = ball;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Moon in front of the planet (bright).
      if (moonFront) drawMoon(0.95);

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
      {/* Planet + moon strip (visual only) */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed right-0 top-0 z-[95]"
      />

      {/* Hit area + slim dark-glass track */}
      <div ref={hitRef} className="fixed bottom-0 right-0 top-0 z-[94] w-4">
        <div className="absolute bottom-2 top-2 right-[5.5px] w-[2px] rounded-full border border-white/5 bg-white/[0.05] backdrop-blur-sm" />
      </div>
    </>
  );
};

export default OrbitScrollbar;
