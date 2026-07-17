/**
 * shaders.ts
 * ------------------------------------------------------------------
 * GLSL for the two particle layers (GLSL ES 1.00 — ShaderMaterial default).
 *
 *   portraitVertex / portraitFragment → reconstructed face
 *   dustVertex     / dustFragment      → emitters + ambient depth field
 * ------------------------------------------------------------------
 */
import { curlNoiseChunk } from "@/lib/particles/curlNoise.glsl";

/* ------------------------------------------------------------------ *
 *  PORTRAIT — vertex
 *  Layered idle motion, velocity-aware hover, directional rim lighting,
 *  staged reveal, perspective depth.
 * ------------------------------------------------------------------ */
export const portraitVertex = /* glsl */ `
uniform float uTime;
uniform vec2  uMouse;
uniform float uMouseActive;
uniform float uMouseVel;       // cursor speed (local units / s)
uniform float uReveal;
uniform float uPixelRatio;
uniform float uSize;
uniform float uMouseRadius;
uniform float uMouseStrength;
uniform float uMouseVelScale;
uniform float uIdleDrift;
uniform float uJitter;
uniform float uOsc;
uniform float uBreath;
uniform float uEdgeDissolve;
uniform float uRimStrength;
uniform float uGlow;
uniform vec2  uWind;   // directional dispersion (up-and-right)

uniform vec3 uColorCore;
uniform vec3 uColorViolet;
uniform vec3 uColorBlue;
uniform vec3 uColorAccent;
uniform vec3 uRimTL;   // top-left  (cool white)
uniform vec3 uRimTR;   // top-right (electric blue)
uniform vec3 uRimB;    // bottom    (purple)

attribute vec3  aColor;
attribute float aSize;
attribute float aRandom;
attribute float aEdge;
attribute float aBrightness;
attribute float aReveal;

varying vec3  vColor;
varying float vAlpha;
varying float vGlow;

${curlNoiseChunk}

void main() {
  vec3 origin = position;
  float t = uTime;

  // ---- Layered idle motion (no single repetitive sine) -------------
  // 1) slow curl-noise drift
  vec3 noiseP = origin * 2.2 + vec3(0.0, 0.0, t * 0.12);
  vec3 drift = curlNoise(noiseP) * uIdleDrift * (0.6 + aRandom);
  // 2) high-frequency micro jitter
  drift += curlNoise(origin * 34.0 + t * 0.7) * uJitter;
  // 3) per-particle oscillation with randomised frequency & phase
  float f = 0.5 + aRandom * 1.7;
  drift += vec3(
    sin(t * f + aRandom * 40.0),
    cos(t * (f * 0.8) + aRandom * 27.0),
    sin(t * (f * 1.3) + aRandom * 13.0)
  ) * uOsc * (0.4 + 0.6 * aRandom);
  // 4) silhouette shedding — outward burst + curl + swirl. Only the very
  //    OUTERMOST rim peels away, so hair/interior stays solid (not exploded).
  float shed = 0.6 + 0.8 * sin(t * 0.5 + aRandom * 6.2831);
  float shedMask = smoothstep(0.55, 1.0, aEdge);
  vec3 radial = normalize(vec3(origin.xy, 0.02) + 1e-4);
  vec3 tangent = vec3(-radial.y, radial.x, 0.0);
  vec3 shedVec = radial * 0.6
               + tangent * (0.25 * sin(t * 0.6 + aRandom * 12.0))
               + curlNoise(noiseP * 1.7 + 12.0) * 0.35;
  drift += shedVec * (uEdgeDissolve * shedMask * shed);
  // 5) breathing scale pulse
  float breath = 1.0 + sin(t * 0.75) * uBreath;

  vec3 pos = origin * breath + drift;

  // ---- Velocity-aware magnetic hover -------------------------------
  vec2 toMouse = pos.xy - uMouse;
  float d = length(toMouse);
  float influence = smoothstep(uMouseRadius, 0.0, d) * uMouseActive;
  float strength = uMouseStrength + uMouseVel * uMouseVelScale;
  // Facial/interior particles resist; only loose EDGE particles fly away,
  // so the face separates gently instead of blowing a glowing hole.
  float hoverMult = 0.3 + 0.7 * aEdge;
  vec2 dir = d > 1e-4 ? toMouse / d : vec2(0.0, 1.0);
  pos.xy += dir * (influence * strength * hoverMult);
  pos.z  += influence * strength * hoverMult * 0.5 * aRandom;

  // ---- Staged reveal: converge from a floating cloud, in order ------
  vec3 scatter = origin + vec3(
    (aRandom - 0.5),
    (fract(aRandom * 31.7) - 0.5),
    (fract(aRandom * 91.3) - 0.5) + 0.6
  ) * 1.6;
  // Map order into [0, 0.8] so the last particles still finish at reveal=1,
  // and everything is hidden at reveal=0.
  float e0 = aReveal * 0.8;
  float appear = smoothstep(e0, e0 + 0.2, uReveal);
  pos = mix(scatter, pos, appear);

  // ---- Project + perspective size attenuation ----------------------
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float atten = 1.0 / max(-mvPosition.z, 0.1);
  gl_PointSize = uSize * aSize * uPixelRatio * atten * (0.85 + 0.3 * breath);
  gl_Position = projectionMatrix * mvPosition;

  // ---- Colour: real face, boosted feature contrast, cold-blue rim ---
  float lum = dot(aColor, vec3(0.299, 0.587, 0.114));
  // Feature contrast: push mid-tones apart so eyes/brows/beard/lips read.
  vec3 col = clamp((aColor - 0.5) * 1.35 + 0.5, 0.0, 1.0);
  col = mix(col, uColorViolet, (1.0 - lum) * 0.18);
  col = mix(col, uColorCore,   pow(lum, 2.2) * 0.45);

  // Outward direction ≈ surface normal for a point cloud.
  vec2 nrm = normalize(origin.xy + 1e-4);
  float tl = max(0.0, dot(nrm, normalize(vec2(-1.0, 1.0))));
  float tr = max(0.0, dot(nrm, normalize(vec2( 1.0, 1.0))));
  float bt = max(0.0, dot(nrm, vec2(0.0, -1.0)));
  float rimMask = mix(0.18, 1.0, aEdge) * (0.55 + 0.45 * (1.0 - lum));
  col += (uRimTL * tl + uRimTR * tr + uRimB * bt) * (uRimStrength * rimMask);

  col = mix(col, uColorAccent, influence * 0.35);

  // Shirt: darken the lower-body interior; keep the shoulder/neckline edges.
  float shirtMask = smoothstep(-0.02, -0.32, origin.y) * (1.0 - aEdge);
  float shirtFade = 1.0 - shirtMask * 0.72;
  // Feature emphasis: high-detail particles (large aSize) glow a touch more.
  float feat = clamp((aSize - 0.7) / 1.6, 0.0, 1.0);

  vColor = col;
  vGlow  = (0.45 + lum * 0.8 + feat * 0.35 + influence * 0.5) * uGlow;
  vAlpha = appear * (0.3 + 0.7 * lum) * shirtFade * (0.85 + 0.3 * feat);
}
`;

/* ------------------------------------------------------------------ *
 *  PORTRAIT — fragment
 *  White-hot core → coloured halo (blue / purple from rim), additive.
 * ------------------------------------------------------------------ */
export const portraitFragment = /* glsl */ `
uniform float uOpacity;

varying vec3  vColor;
varying float vAlpha;
varying float vGlow;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float dist = length(uv);
  if (dist > 0.5) discard;

  float core = smoothstep(0.5, 0.0, dist);
  float halo = pow(core, 1.9); // tighter, softer falloff → less overlap blowout
  // Cool near-white core at a reduced amount → much less white bloom.
  vec3 color = mix(vColor, vec3(0.78, 0.86, 1.0), pow(core, 4.0) * 0.5) * vGlow;
  gl_FragColor = vec4(color, halo * vAlpha * uOpacity);
}
`;

/* ------------------------------------------------------------------ *
 *  DUST — vertex
 *  aType 1 → silhouette emitter (rise / fade / respawn, hair rises more)
 *  aType 0 → ambient depth field (soft bokeh in space, very slow drift)
 * ------------------------------------------------------------------ */
export const dustVertex = /* glsl */ `
uniform float uTime;
uniform float uReveal;
uniform float uPixelRatio;
uniform float uEmitterSize;
uniform float uDepthSize;

attribute vec3  aVel;
attribute float aSeed;
attribute float aSize;
attribute float aType;    // 1 = emitter, 0 = depth field
attribute float aRegion;  // emitter "hairness" (rises more when high)

varying float vAlpha;
varying float vTint;
varying float vType;

void main() {
  vec3 pos;
  float alpha;

  if (aType > 0.5) {
    // ---- Silhouette emitter: detach, rise, fade, respawn ----------
    float life = fract(uTime * (0.05 + aSeed * 0.06) + aSeed);
    vec3 rise = vec3(0.0, 0.06 + aRegion * 0.12, 0.0); // only a small upward force
    pos = position + aVel * life + rise * life;
    // Swirling curl as the mote peels away (grows over its life).
    float sway = life * (0.5 + aSeed);
    pos.x += sin(uTime * 0.6 + aSeed * 30.0) * 0.03 * sway;
    pos.z += cos(uTime * 0.5 + aSeed * 22.0) * 0.025 * sway;
    float fin = smoothstep(0.0, 0.12, life);
    float fout = smoothstep(1.0, 0.5, life);
    alpha = fin * fout;
    gl_PointSize = uEmitterSize * aSize * uPixelRatio;
  } else {
    // ---- Ambient depth field: slow parallax twinkle in space ------
    pos = position + aVel * sin(uTime * 0.1 + aSeed * 6.2831) * 0.5;
    alpha = (0.35 + 0.35 * sin(uTime * 0.3 + aSeed * 10.0));
    gl_PointSize = uDepthSize * aSize * uPixelRatio;
  }

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float atten = 1.0 / max(-mvPosition.z, 0.1);
  gl_PointSize *= atten;
  gl_Position = projectionMatrix * mvPosition;

  vAlpha = alpha * uReveal;
  vTint = aSeed;
  vType = aType;
}
`;

/* ------------------------------------------------------------------ *
 *  DUST — fragment
 * ------------------------------------------------------------------ */
export const dustFragment = /* glsl */ `
uniform float uOpacity;
uniform vec3  uColorViolet;
uniform vec3  uColorBlue;
uniform vec3  uColorCore;

varying float vAlpha;
varying float vTint;
varying float vType;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float dist = length(uv);
  if (dist > 0.5) discard;

  float core = smoothstep(0.5, 0.0, dist);
  vec3 col = mix(uColorViolet, uColorBlue, vTint);
  col = mix(col, uColorCore, pow(core, 3.0) * 0.6);

  // Depth-field motes fall off softer (blurrier bokeh) than emitters.
  float soft = vType > 0.5 ? 1.5 : 2.6;
  gl_FragColor = vec4(col, pow(core, soft) * vAlpha * uOpacity);
}
`;
