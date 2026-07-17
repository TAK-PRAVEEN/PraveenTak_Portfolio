/**
 * ParticleField.tsx
 * ------------------------------------------------------------------
 * Mounted inside the R3F <Canvas>. Owns:
 *   • the portrait BufferGeometry (from the sampled point cloud),
 *   • the additive ShaderMaterial + every uniform,
 *   • an invisible pick-plane that maps the cursor into local space,
 *   • the ambient DustField (emitters + depth field),
 *   • the single useFrame loop: layered time, cursor velocity, holographic
 *     depth-tilt, and the play-once reveal — mutating a handful of uniforms.
 *
 * All per-particle simulation stays on the GPU; the CPU loop only touches
 * scalars/vectors, keeping this a single draw call per layer.
 * ------------------------------------------------------------------
 */
import { useEffect, useMemo, useRef } from "react";
import { ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import DustField, { DustUniforms } from "./DustField";
import { portraitFragment, portraitVertex } from "./shaders";
import { DUST_PARAMS, PALETTE, PORTRAIT_PARAMS, RIM } from "./config";
import type { SampledParticles } from "@/lib/particles/sampleImage";

interface ParticleFieldProps {
  data: SampledParticles;
  inView: boolean;
  emitterCount: number;
  depthCount: number;
  pointSize: number;
  glow: number;
}

const v3 = (c: [number, number, number]) => new THREE.Vector3(c[0], c[1], c[2]);
const REF_SPEED = 5.0; // cursor speed (local units/s) that counts as "fast"

const ParticleField = ({ data, inView, emitterCount, depthCount, pointSize, glow }: ParticleFieldProps) => {
  const gl = useThree((s) => s.gl);
  const groupRef = useRef<THREE.Group>(null);

  const pointer = useRef({ x: 0, y: 0, active: 0 });
  const prevPointer = useRef({ x: 0, y: 0 });
  const reveal = useRef(0);
  const revealedOnce = useRef(false);

  // --- Portrait geometry ---------------------------------------------
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(data.colors, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(data.sizes, 1));
    g.setAttribute("aRandom", new THREE.BufferAttribute(data.randoms, 1));
    g.setAttribute("aEdge", new THREE.BufferAttribute(data.edges, 1));
    g.setAttribute("aBrightness", new THREE.BufferAttribute(data.brightness, 1));
    g.setAttribute("aReveal", new THREE.BufferAttribute(data.reveal, 1));
    return g;
  }, [data]);

  const dpr = gl.getPixelRatio();

  // --- Portrait uniforms (created once, mutated per frame) -----------
  const portraitUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseActive: { value: 0 },
      uMouseVel: { value: 0 },
      uReveal: { value: 0 },
      uPixelRatio: { value: dpr },
      uSize: { value: pointSize },
      uMouseRadius: { value: PORTRAIT_PARAMS.mouseRadius },
      uMouseStrength: { value: PORTRAIT_PARAMS.mouseStrength },
      uMouseVelScale: { value: PORTRAIT_PARAMS.mouseVelScale },
      uIdleDrift: { value: PORTRAIT_PARAMS.idleDrift },
      uJitter: { value: PORTRAIT_PARAMS.jitter },
      uOsc: { value: PORTRAIT_PARAMS.osc },
      uBreath: { value: PORTRAIT_PARAMS.breath },
      uEdgeDissolve: { value: PORTRAIT_PARAMS.edgeDissolve },
      uRimStrength: { value: PORTRAIT_PARAMS.rimStrength },
      uGlow: { value: glow },
      uWind: { value: new THREE.Vector2(PORTRAIT_PARAMS.windX, PORTRAIT_PARAMS.windY) },
      uOpacity: { value: PORTRAIT_PARAMS.opacity },
      uColorCore: { value: v3(PALETTE.core) },
      uColorViolet: { value: v3(PALETTE.violet) },
      uColorBlue: { value: v3(PALETTE.blue) },
      uColorAccent: { value: v3(PALETTE.accent) },
      uRimTL: { value: v3(RIM.topLeft) },
      uRimTR: { value: v3(RIM.topRight) },
      uRimB: { value: v3(RIM.bottom) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const dustUniforms = useMemo<DustUniforms>(
    () => ({
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uPixelRatio: { value: dpr },
      uEmitterSize: { value: DUST_PARAMS.emitterSize },
      uDepthSize: { value: DUST_PARAMS.depthSize },
      uOpacity: { value: DUST_PARAMS.opacity * glow },
      uColorViolet: { value: v3(PALETTE.violet) },
      uColorBlue: { value: v3(PALETTE.blue) },
      uColorCore: { value: v3(PALETTE.core) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: portraitUniforms as unknown as Record<string, THREE.IUniform>,
        vertexShader: portraitVertex,
        fragmentShader: portraitFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [portraitUniforms],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  // --- Pointer → local space via an invisible pick-plane -------------
  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    pointer.current.x = e.point.x;
    pointer.current.y = e.point.y;
    pointer.current.active = 1;
  };
  const onPointerOut = () => {
    pointer.current.active = 0;
  };

  // --- Single per-frame update ---------------------------------------
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const P = portraitUniforms;

    P.uTime.value = t;
    dustUniforms.uTime.value = t;

    // Reveal — plays once, monotonic (never replays on scroll).
    if (inView) revealedOnce.current = true;
    if (revealedOnce.current && reveal.current < 1) {
      reveal.current = Math.min(1, reveal.current + dt * PORTRAIT_PARAMS.revealSpeed);
    }
    P.uReveal.value = reveal.current;
    dustUniforms.uReveal.value = reveal.current;

    // Cursor velocity (normalised 0..1) from raw target movement.
    const vx = (pointer.current.x - prevPointer.current.x) / Math.max(dt, 1e-3);
    const vy = (pointer.current.y - prevPointer.current.y) / Math.max(dt, 1e-3);
    const velNorm = Math.min(1, Math.hypot(vx, vy) / REF_SPEED) * pointer.current.active;
    prevPointer.current.x = pointer.current.x;
    prevPointer.current.y = pointer.current.y;
    P.uMouseVel.value += (velNorm - P.uMouseVel.value) * Math.min(1, dt * 8);

    // Ease mouse position (lag → outer particles trail the cursor).
    const m = P.uMouse.value;
    m.x += (pointer.current.x - m.x) * Math.min(1, dt * 12);
    m.y += (pointer.current.y - m.y) * Math.min(1, dt * 12);
    P.uMouseActive.value += (pointer.current.active - P.uMouseActive.value) * Math.min(1, dt * 6);

    // Holographic depth-tilt (~2°), returns to flat when the cursor leaves.
    if (groupRef.current) {
      const tilt = PORTRAIT_PARAMS.depthTilt;
      const targetRy = m.x * 2.0 * tilt * P.uMouseActive.value;
      const targetRx = -m.y * 2.0 * tilt * P.uMouseActive.value;
      groupRef.current.rotation.y += (targetRy - groupRef.current.rotation.y) * Math.min(1, dt * 4);
      groupRef.current.rotation.x += (targetRx - groupRef.current.rotation.x) * Math.min(1, dt * 4);
    }

    const ratio = state.gl.getPixelRatio();
    P.uPixelRatio.value = ratio;
    dustUniforms.uPixelRatio.value = ratio;
  });

  return (
    <>
      {/* Portrait + dust tilt together for holographic depth */}
      <group ref={groupRef}>
        <points geometry={geometry} material={material} frustumCulled={false} />
        <DustField
          emitterCount={emitterCount}
          depthCount={depthCount}
          emitters={data.emitters}
          emitterRegions={data.emitterRegions}
          aspect={data.aspect}
          uniforms={dustUniforms}
        />
      </group>

      {/* Invisible cursor pick-plane (world space, does not tilt) */}
      <mesh onPointerMove={onPointerMove} onPointerOut={onPointerOut}>
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  );
};

export default ParticleField;
