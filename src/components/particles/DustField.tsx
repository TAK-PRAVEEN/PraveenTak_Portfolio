/**
 * DustField.tsx
 * ------------------------------------------------------------------
 * Two ambient layers packed into ONE draw call, distinguished by aType:
 *
 *   aType = 1  Silhouette emitters — spawn on the real portrait edge
 *              (hair-biased), detach, rise, fade, then respawn. This is
 *              the continuous cinematic dust around hair / shoulders /
 *              beard / shirt edges.
 *   aType = 0  Ambient depth field — soft bokeh scattered through space
 *              at varied depth (far = large & soft, near = small), with
 *              very slow parallax drift, so the portrait feels in a volume.
 *
 * Geometry is built once; time/reveal uniforms are driven by the parent
 * ParticleField's single useFrame loop.
 * ------------------------------------------------------------------
 */
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { dustFragment, dustVertex } from "./shaders";

export interface DustUniforms {
  uTime: { value: number };
  uReveal: { value: number };
  uPixelRatio: { value: number };
  uEmitterSize: { value: number };
  uDepthSize: { value: number };
  uOpacity: { value: number };
  uColorViolet: { value: THREE.Vector3 };
  uColorBlue: { value: THREE.Vector3 };
  uColorCore: { value: THREE.Vector3 };
}

interface DustFieldProps {
  emitterCount: number;
  depthCount: number;
  emitters: Float32Array; // xyz silhouette spawn points
  emitterRegions: Float32Array; // 0..1 "hairness"
  aspect: number;
  uniforms: DustUniforms;
}

const DustField = ({
  emitterCount,
  depthCount,
  emitters,
  emitterRegions,
  aspect,
  uniforms,
}: DustFieldProps) => {
  const geometry = useMemo(() => {
    const total = emitterCount + depthCount;
    const position = new Float32Array(total * 3);
    const vel = new Float32Array(total * 3);
    const seed = new Float32Array(total);
    const size = new Float32Array(total);
    const type = new Float32Array(total);
    const region = new Float32Array(total);

    const available = Math.floor(emitters.length / 3);
    const halfW = 0.5 * aspect;

    // --- Silhouette emitters ---
    for (let i = 0; i < emitterCount; i++) {
      let sx: number, sy: number, sz: number, reg: number;
      if (available > 0) {
        const e = Math.floor(Math.random() * available);
        sx = emitters[e * 3] + (Math.random() - 0.5) * 0.01;
        sy = emitters[e * 3 + 1] + (Math.random() - 0.5) * 0.01;
        sz = emitters[e * 3 + 2];
        reg = emitterRegions[e];
      } else {
        // Fallback: spread around the portrait if no edges were found.
        sx = (Math.random() - 0.5) * halfW * 2;
        sy = Math.random() - 0.5;
        sz = 0;
        reg = Math.max(0, 1 - (0.5 - sy) * 1.7);
      }
      position[i * 3] = sx;
      position[i * 3 + 1] = sy;
      position[i * 3 + 2] = sz;

      // Radial dispersion: motes stream OUTWARD from the portrait centre
      // (hair bursts up-and-out, shoulders/sides move away from the body),
      // plus a small upward force and random spread. The in-shader sway
      // adds the curl-noise feel — "floating energy particles", not smoke.
      const len = Math.hypot(sx, sy) || 1;
      const spd = 0.12 + Math.random() * 0.2;
      vel[i * 3] = (sx / len) * spd + (Math.random() - 0.5) * 0.05;
      vel[i * 3 + 1] = (sy / len) * spd + 0.06 + (Math.random() - 0.5) * 0.05;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.06;

      seed[i] = Math.random();
      size[i] = 0.6 + Math.random() * 1.3;
      type[i] = 1;
      region[i] = reg;
    }

    // --- Ambient depth field ---
    for (let j = 0; j < depthCount; j++) {
      const i = emitterCount + j;
      const depth = Math.random(); // 0 = far .. 1 = near
      position[i * 3] = (Math.random() - 0.5) * halfW * 3.2;
      position[i * 3 + 1] = (Math.random() - 0.5) * 1.6;
      position[i * 3 + 2] = THREE.MathUtils.lerp(-2.6, 0.2, depth);

      // Very slow parallax drift amplitude.
      vel[i * 3] = (Math.random() - 0.5) * 0.08;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.06;
      vel[i * 3 + 2] = 0;

      seed[i] = Math.random();
      size[i] = THREE.MathUtils.lerp(2.6, 0.5, depth); // far → large & soft
      type[i] = 0;
      region[i] = 0;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(position, 3));
    g.setAttribute("aVel", new THREE.BufferAttribute(vel, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aType", new THREE.BufferAttribute(type, 1));
    g.setAttribute("aRegion", new THREE.BufferAttribute(region, 1));
    return g;
  }, [emitterCount, depthCount, emitters, emitterRegions, aspect]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
        vertexShader: dustVertex,
        fragmentShader: dustFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <points geometry={geometry} material={material} frustumCulled={false} />;
};

export default DustField;
