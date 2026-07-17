/**
 * sampleImage.ts
 * ------------------------------------------------------------------
 * Turns a source portrait into a GPU-ready point cloud + emitter set.
 *
 * Pipeline:
 *   1. Load image → offscreen canvas at a working resolution scaled from
 *      the target particle count (denser than before for a solid look).
 *   2. Read pixels → luminance buffer + background mask (alpha cut-out,
 *      else blue-sky / bright-cloud chroma key).
 *   3. Sobel gradient → the "feature" signal (eyes, brows, hairline,
 *      beard, nose, lips get the strongest response).
 *   4. Importance-sample, strongly biasing density + size toward features
 *      (sweater / background stay sparse).
 *   5. Emit flat Float32Arrays: position (scaled to leave an overflow
 *      margin), colour, size, random seed, silhouette edge, brightness,
 *      and a per-particle REVEAL ORDER (hair → eyes → beard → face).
 *   6. Emit a subsampled set of silhouette EMITTERS (hair-biased) that the
 *      dust layer uses as continuous spawn points.
 *
 * The face is never redrawn — every particle carries the real sampled
 * RGB, so facial identity is preserved exactly.
 * ------------------------------------------------------------------
 */
import { PORTRAIT_PARAMS } from "@/components/particles/config";

export interface SampledParticles {
  count: number;
  positions: Float32Array; // xyz, centred, aspect-correct, scaled for margin
  colors: Float32Array; // rgb 0..1 straight from the photo
  sizes: Float32Array; // per-particle base size (feature weighted)
  randoms: Float32Array; // 0..1 phase seed
  edges: Float32Array; // 0..1 silhouette proximity
  brightness: Float32Array; // 0..1 luminance
  reveal: Float32Array; // 0..1 reconstruction order (0 = appears first)
  aspect: number;
  // Silhouette emitters (spawn points for the continuous dust).
  emitterCount: number;
  emitters: Float32Array; // xyz
  emitterRegions: Float32Array; // 0..1 "hairness" (1 = top → rises strongly)
}

export interface SampleOptions {
  targetCount: number;
  alphaThreshold?: number;
}

function luma(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

const MAX_EMITTER_CANDIDATES = 6000;

export async function sampleImage(
  src: string,
  { targetCount, alphaThreshold = 200 }: SampleOptions,
): Promise<SampledParticles> {
  const img = await loadImage(src);
  const aspect = img.width / img.height;
  const S = PORTRAIT_PARAMS.positionScale; // shrink to leave an overflow margin

  // --- 1. Working resolution from the target count --------------------
  const subjectFraction = 0.42;
  const desiredPixels = Math.min(2_600_000, Math.round(targetCount / (subjectFraction * 0.55)));
  let h = Math.round(Math.sqrt(desiredPixels / aspect));
  h = Math.max(200, Math.min(1200, h));
  const w = Math.max(1, Math.round(h * aspect));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas context unavailable");
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  const pixelCount = w * h;

  // --- 2. Luminance + background mask ---------------------------------
  let transparent = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] < alphaThreshold) transparent++;
  const hasAlpha = transparent > pixelCount * 0.03;

  const lumaBuf = new Float32Array(pixelCount);
  const bg = new Uint8Array(pixelCount);

  for (let p = 0; p < pixelCount; p++) {
    const i = p * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const L = luma(r, g, b);
    lumaBuf[p] = L;

    if (hasAlpha) {
      bg[p] = a < 128 ? 1 : 0;
    } else {
      const isSky = b > 110 && b >= g - 5 && g >= r && b - r > 12 && L > 100;
      const maxc = Math.max(r, g, b);
      const minc = Math.min(r, g, b);
      const sat = maxc === 0 ? 0 : (maxc - minc) / maxc;
      const isCloud = L > 212 && sat < 0.12;
      bg[p] = isSky || isCloud ? 1 : 0;
    }
  }

  // --- 3. Sobel gradient (feature strength) ---------------------------
  const grad = new Float32Array(pixelCount);
  let gradMax = 1e-5;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (bg[p]) continue;
      const tl = lumaBuf[p - w - 1], tc = lumaBuf[p - w], tr = lumaBuf[p - w + 1];
      const ml = lumaBuf[p - 1], mr = lumaBuf[p + 1];
      const bl = lumaBuf[p + w - 1], bc = lumaBuf[p + w], br = lumaBuf[p + w + 1];
      const gx = tr + 2 * mr + br - (tl + 2 * ml + bl);
      const gy = bl + 2 * bc + br - (tl + 2 * tc + tr);
      const mag = Math.sqrt(gx * gx + gy * gy);
      grad[p] = mag;
      if (mag > gradMax) gradMax = mag;
    }
  }
  const invGradMax = 1 / gradMax;

  // --- 4. Importance sampling (strong feature bias) -------------------
  let weightSum = 0;
  for (let p = 0; p < pixelCount; p++) {
    if (bg[p]) continue;
    const gN = grad[p] * invGradMax;
    const L = lumaBuf[p] / 255;

      const py = Math.floor(p / w);
      const px = p % w;

      const dx = (px / w - 0.5) / 0.42;
      const dy = (py / h - 0.42) / 0.55;

      const faceMask =
      Math.max(
      0,
      1 - Math.sqrt(dx*dx + dy*dy)
      );
      const featureBoost =
      Math.pow(gN, 0.85) * 1.25;

    const importance =
    0.4 +
    featureBoost +
    faceMask*0.9 +
    L*0.2;

    weightSum += importance; // squared → sharper feature focus
  }
  const scale = weightSum > 0 ? targetCount / weightSum : 1;

  const px: number[] = [], py: number[] = [], pz: number[] = [];
  const cr: number[] = [], cg: number[] = [], cb: number[] = [];
  const sz: number[] = [], rnd: number[] = [], edg: number[] = [];
  const bri: number[] = [], rev: number[] = [];

  // Emitter candidates (silhouette points, hair-biased).
  const emX: number[] = [], emY: number[] = [], emZ: number[] = [], emR: number[] = [];

  const isBg = (x: number, y: number): boolean =>
    x < 0 || y < 0 || x >= w || y >= h || bg[y * w + x] === 1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (bg[p]) continue;

      const gN = grad[p] * invGradMax;
      const yTop = y / h;

      const centerY = Math.abs(yTop - 0.45);
      const centerX = Math.abs(x / w - 0.5);

      const centerWeight =
        1 -
        Math.min(
          1,
          Math.sqrt(centerX * centerX + centerY * centerY) * 1.5
        );

      const featureBoost = gN * 1.3;
      const i = p * 4;
      const L = lumaBuf[p] / 255;
      const dx = (x / w - 0.5) / 0.42;
      const dy = (y / h - 0.42) / 0.55;

      const faceMask =
      Math.max(
          0,
          1 - Math.sqrt(dx * dx + dy * dy)
      );

      const weight =
          0.45 +
          featureBoost +
          faceMask * 1.0 +
          L * 0.15;

      const threshold =
      Math.min(
          0.98,
          weight * scale
      );

      if (Math.random() > threshold)
          continue;


      // Position — centred, aspect-correct, scaled to leave a margin.
      const X = (x / w - 0.5) * aspect * S;
      const Y = (0.5 - y / h) * S;
      px.push(X);
      py.push(Y);
      pz.push(
      (
      (Math.random()-0.5)*0.012 +
      (L-0.5)*0.018
      )*S);
      cr.push(data[i] / 255);
      cg.push(data[i + 1] / 255);
      cb.push(data[i + 2] / 255);

      const particleSize =
          0.22 +
          gN * 0.95 +
          faceMask * 0.20;

      sz.push(particleSize);
      rnd.push(Math.random());
      bri.push(L);

      // Silhouette proximity (1 boundary, 0.5 within a 2px ring).
      let edge = 0;
      if (
        isBg(x - 1, y) || isBg(x + 1, y) || isBg(x, y - 1) || isBg(x, y + 1) ||
        isBg(x - 1, y - 1) || isBg(x + 1, y - 1) || isBg(x - 1, y + 1) || isBg(x + 1, y + 1)
      ) edge = 1;
      else if (isBg(x - 2, y) || isBg(x + 2, y) || isBg(x, y - 2) || isBg(x, y + 2)) edge = 0.65;
      edg.push(edge);

      // Reveal order: hair (top) first → face → sweater last; features lead.
      const revealOrder =
      Math.max(
          0,
          Math.min(
              1,
              yTop * 0.55 +
              (1 - faceMask) * 0.20 +
              (1 - gN) * 0.15 +
              Math.random() * 0.03
          )
      );

      rev.push(revealOrder);
      // Collect silhouette points as dust emitters, concentrated where the
      // mockup disperses: the hair (top) and the right edge. Left-side edges
      // are dropped so particles don't blow back across the face.
      if (
          edge >= 0.65 &&
          emX.length < MAX_EMITTER_CANDIDATES &&
          Math.random() < 0.55
      ) {
        const hairness = Math.max(0, Math.min(1, 1 - yTop * 1.7));
        if (hairness > 0.15 || edge > 0.5) {
          emX.push(X);
          emY.push(Y);
          emZ.push(pz[pz.length - 1]);
          emR.push(hairness);
        }
      }
    }
  }

  const count = px.length;
  if (count === 0) throw new Error("No subject particles were sampled (background key too aggressive?)");

  // --- 5. Pack particle arrays ----------------------------------------
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const randoms = new Float32Array(count);
  const edges = new Float32Array(count);
  const brightness = new Float32Array(count);
  const reveal = new Float32Array(count);

  for (let n = 0; n < count; n++) {
    positions[n * 3] = px[n];
    positions[n * 3 + 1] = py[n];
    positions[n * 3 + 2] = pz[n];
    colors[n * 3] = cr[n];
    colors[n * 3 + 1] = cg[n];
    colors[n * 3 + 2] = cb[n];
    sizes[n] = sz[n];
    randoms[n] = rnd[n];
    edges[n] = edg[n];
    brightness[n] = bri[n];
    reveal[n] = rev[n];
  }

  // --- 6. Pack emitters -----------------------------------------------
  const emitterCount = emX.length;
  const emitters = new Float32Array(emitterCount * 3);
  const emitterRegions = new Float32Array(emitterCount);
  for (let n = 0; n < emitterCount; n++) {
    emitters[n * 3] = emX[n];
    emitters[n * 3 + 1] = emY[n];
    emitters[n * 3 + 2] = emZ[n];
    emitterRegions[n] = emR[n];
  }

  return {
    count, positions, colors, sizes, randoms, edges, brightness, reveal, aspect,
    emitterCount, emitters, emitterRegions,
  };
}
