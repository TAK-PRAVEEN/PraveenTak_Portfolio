/**
 * NeuralCursor.tsx
 * ------------------------------------------------------------------
 * "AI neural network" custom cursor:
 *   • a core dot ● at the pointer,
 *   • 6 tiny orbiting nodes that follow with springy lag,
 *   • animated links core→node and node→node (alpha by distance),
 *   • fast movement stretches the connections (nodes trail behind),
 *   • hovering interactive elements expands the cluster and creates
 *     ADDITIONAL links (bigger link distance + brighter).
 *
 * Canvas overlay, pointer-events: none. The native cursor is already
 * hidden globally (cursor: none in index.css). Skipped on touch devices.
 * (Previous cursor: components/CustomCursor.tsx — kept for comparison.)
 * ------------------------------------------------------------------
 */
import { useEffect, useRef } from "react";

const NODE_COUNT = 6; // 4–8 tiny nodes
const BASE_RADIUS = 18; // cluster radius at rest
const HOVER_RADIUS = 30; // cluster expands on interactive hover
const LINK_DIST = 46; // node↔node link distance
const HOVER_LINK_DIST = 82; // more links while hovering
const NODE_RGB = "122, 168, 255"; // cold electric blue (#7AA8FF)
const CORE_COLOR = "rgba(191, 212, 255, 0.95)"; // cold white-blue core

const INTERACTIVE =
  'a, button, [role="button"], input, textarea, select, label, [data-cursor="hover"], .cursor-pointer';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  r: number;
}

const NeuralCursor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // No custom cursor on touch devices.
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -100, y: -100 };
    let hovering = false;

    // Nodes evenly spread around the core, each with its own orbit
    // speed and radius so the cluster feels alive, not mechanical.
    const nodes: Node[] = Array.from({ length: NODE_COUNT }, (_, i) => ({
      x: -100,
      y: -100,
      vx: 0,
      vy: 0,
      angle: (i / NODE_COUNT) * Math.PI * 2,
      speed: 0.5 + Math.random() * 0.7,
      r: 0.75 + Math.random() * 0.7,
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
    };

    // Track whether the pointer is over anything interactive.
    const onOver = (e: Event) => {
      const el = e.target as Element | null;
      hovering = !!el?.closest?.(INTERACTIVE);
    };

    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const radius = hovering ? HOVER_RADIUS : BASE_RADIUS;
      const linkDist = hovering ? HOVER_LINK_DIST : LINK_DIST;

      // --- Node physics: spring toward slowly-orbiting targets. -------
      // The spring lag makes connections STRETCH while the cursor moves.
      for (const n of nodes) {
        n.angle += n.speed * 0.016;
        const tx = mouse.x + Math.cos(n.angle) * radius * n.r;
        const ty = mouse.y + Math.sin(n.angle) * radius * n.r;
        n.vx += (tx - n.x) * 0.12;
        n.vy += (ty - n.y) * 0.12;
        n.vx *= 0.72;
        n.vy *= 0.72;
        n.x += n.vx;
        n.y += n.vy;
      }

      ctx.lineWidth = 1;

      // --- Links: core → node (always) --------------------------------
      for (const n of nodes) {
        const dist = Math.hypot(n.x - mouse.x, n.y - mouse.y);
        const a = Math.max(0, 1 - dist / (linkDist * 1.6)) * 0.55 + 0.08;
        ctx.strokeStyle = `rgba(${NODE_RGB}, ${a})`;
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(n.x, n.y);
        ctx.stroke();
      }

      // --- Links: node ↔ node (distance-based; MORE while hovering) ---
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < linkDist) {
            const alpha = (1 - dist / linkDist) * (hovering ? 0.75 : 0.4);
            ctx.strokeStyle = `rgba(${NODE_RGB}, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // --- Nodes -------------------------------------------------------
      for (const n of nodes) {
        ctx.fillStyle = `rgba(${NODE_RGB}, 0.9)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, hovering ? 2.4 : 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- Core dot ● ---------------------------------------------------
      ctx.fillStyle = CORE_COLOR;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, hovering ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fill();

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

export default NeuralCursor;
