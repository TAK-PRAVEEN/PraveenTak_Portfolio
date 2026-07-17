/**
 * config.ts
 * ------------------------------------------------------------------
 * Central tuning surface for the particle portrait: device tiers,
 * particle budgets, the colour palette / rim lights, and the physics
 * constants fed into the GLSL uniforms.
 *
 * Data only (no Three.js objects) so it stays cheap to import anywhere.
 * ------------------------------------------------------------------
 */

export type DeviceTier = "desktop" | "laptop" | "tablet" | "mobile";

export interface TierConfig {
  /** Portrait particles (the reconstructed face). */
  particleTarget: number;
  /** Silhouette emitter motes (rise / fade / respawn). */
  emitterCount: number;
  /** Ambient depth-field motes (bokeh in space). */
  depthCount: number;
  /** Renderer device-pixel-ratio cap. */
  dprCap: number;
  /** Base sprite size (device px, before perspective attenuation). */
  pointSize: number;
  /** Global glow/opacity multiplier (lower on mobile). */
  glow: number;
}

/**
 * Budgets per tier. Densities are high enough that from a normal viewing
 * distance the portrait reads as solid, with individual particles only
 * resolving on zoom. Mobile keeps the SAME experience at lower counts.
 */
export const TIER_CONFIG: Record<DeviceTier, TierConfig> = {
  desktop: { particleTarget: 280_000, emitterCount: 2500, depthCount: 325, dprCap: 2, pointSize: 5.4, glow: 0.65 },
  laptop: { particleTarget: 180_000, emitterCount: 1250, depthCount: 250, dprCap: 1.75, pointSize: 5.8, glow: 0.75 },
  tablet: { particleTarget: 90_000, emitterCount: 625, depthCount: 150, dprCap: 1.5, pointSize: 6.4, glow: 0.5 },
  mobile: { particleTarget: 45_000, emitterCount: 325, depthCount: 100, dprCap: 1.5, pointSize: 6.8, glow: 0.5 },
};

/**
 * Palette as raw sRGB triples (0..1). Fed to the shader as plain vec3
 * uniforms with gl_FragColor written directly, so we bypass Three's
 * colour management (what we author == what is displayed).
 * Derived from src/index.css tokens (primary/secondary/accent).
 */
export const PALETTE = {
  core: [0.82, 0.9, 1.0] as Vec3, // cool white core (not pure white → less bloom)
  violet: [0.26, 0.3, 0.6] as Vec3, // cold indigo shadow tint (less purple)
  blue: [0.2, 0.4, 0.85] as Vec3, // colder blue
  accent: [0.42, 0.56, 0.95] as Vec3, // cold blue hover (was purple)
};

/**
 * Directional rim lights (shader-side only — never CSS). Each colour is
 * applied where a particle's outward direction faces that light.
 */
export const RIM = {
  topLeft: [0.75, 0.83, 1.0] as Vec3, // cold white-blue (#BFD4FF)
  topRight: [0.48, 0.66, 1.0] as Vec3, // colder electric blue (#7AA8FF)
  bottom: [0.42, 0.54, 0.9] as Vec3, // cold indigo-blue (less purple)
};

type Vec3 = [number, number, number];

/**
 * Physics / look constants (uniforms). Spatial values are in the
 * portrait's local space (image height ≈ 1 unit before positionScale).
 */
export const PORTRAIT_PARAMS = {
  /** Fit the portrait into this fraction of the view, leaving a margin
   *  so hair / dust / glow can extend beyond the face without clipping. */
  positionScale: 0.82,

  // --- Hover (velocity aware) ---
  mouseRadius: 0.24,
  mouseStrength: 0.044, // -20% (premium subtle motion)
  mouseVelScale: 0.064, // -20%

  // --- Layered idle motion ---
  idleDrift: 0.003, // slow curl-noise float
  jitter: 0.0008, // high-frequency micro jitter
  osc: 0.0018, // per-particle random oscillation
  breath: 0.008, // breathing scale pulse
  edgeDissolve: 0.055, // gentle outward silhouette shedding

  // --- Look ---
  rimStrength: 1.2, // reduced glow (Change 3: darker/subtler edge)
  opacity: 0.78, // reduced bloom (Change 3)

  // --- Directional dispersion "wind" (up-and-right, matching the mockup) ---
  windX: 0.55,
  windY: 0.42,

  // --- Depth tilt (holographic parallax, radians ≈ 2°) ---
  depthTilt: 0.035,

  // --- Reconstruction ---
  revealSpeed: 0.42, // units of reveal progress per second (plays once)
};

export const DUST_PARAMS = {
  emitterSize: 2.6,
  depthSize: 6.0, // ambient bokeh are larger + softer
  opacity: 0.5,
};

/** Detect a coarse device tier from viewport, pointer type, hardware. */
export function detectDeviceTier(): DeviceTier {
  if (typeof window === "undefined") return "laptop";

  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  const width = window.innerWidth;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

  if (coarse) return width < 640 ? "mobile" : "tablet";
  if (cores <= 4 || mem <= 4 || width < 1440) return "laptop";
  return "desktop";
}
