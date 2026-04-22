import { Suspense, memo, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const ENGINEER_COLOR = "#1b3a5b";
const HEALTHCARE_COLOR = "#4a8f9b";
const ACCENT_COLOR = "#86c7cc";

const PALETTE = [
  new THREE.Color(ENGINEER_COLOR),
  new THREE.Color(HEALTHCARE_COLOR),
  new THREE.Color(ACCENT_COLOR),
];

const COLOR_CYCLE_SECONDS = 4.5; // spec: 4-5s
const ROTATION_PERIOD_SECONDS = 20; // spec: 1 turn per 20s
const ROTATION_OMEGA = (Math.PI * 2) / ROTATION_PERIOD_SECONDS;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const isLowPowerDevice = () => {
  if (typeof navigator === "undefined") return false;
  const cores = (navigator as Navigator & { hardwareConcurrency?: number })
    .hardwareConcurrency;
  return typeof cores === "number" && cores > 0 && cores < 4;
};

/**
 * Samples a position around the 3-stop palette loop (engineer → healthcare →
 * accent → engineer) using smoothstep easing so the transitions feel breathing
 * rather than linear.
 */
const sampleCycleColor = (t: number, target: THREE.Color) => {
  // t in [0, 1) across the whole cycle. Three segments of length 1/3.
  const phase = t * 3;
  const segment = Math.floor(phase) % 3;
  const local = phase - Math.floor(phase);
  // smoothstep for a meditative ease-in-out between stops
  const eased = local * local * (3 - 2 * local);

  const from = PALETTE[segment];
  const to = PALETTE[(segment + 1) % 3];
  target.copy(from).lerp(to, eased);
};

const CalmSphere = memo(() => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const colorScratch = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;

    // Very slow rotation — one turn per 20s, subtle tilt on x for life
    mesh.rotation.y += ROTATION_OMEGA * delta;
    mesh.rotation.x += ROTATION_OMEGA * 0.25 * delta;

    const elapsed = state.clock.getElapsedTime();

    // Smooth palette cycle
    const cycleT = (elapsed / COLOR_CYCLE_SECONDS) % 1;
    sampleCycleColor(cycleT, colorScratch);
    material.color.copy(colorScratch);
    material.emissive.copy(colorScratch);

    // Gentle breathing glow, independent cadence (≈ 3.2s breath)
    const pulse = (Math.sin(elapsed * (Math.PI * 2) / 3.2) + 1) * 0.5;
    material.emissiveIntensity = 0.2 + pulse * 0.2; // 0.2 → 0.4

    // Almost imperceptible scale breathing (~1.5%) for a meditative feel
    const scale = 1 + pulse * 0.015;
    mesh.scale.setScalar(scale);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        ref={materialRef}
        color={HEALTHCARE_COLOR}
        emissive={HEALTHCARE_COLOR}
        emissiveIntensity={0.3}
        roughness={0.32}
        metalness={0.35}
      />
    </mesh>
  );
});

CalmSphere.displayName = "CalmSphere";

interface EmptyOrbProps {
  className?: string;
  /** Smaller scene for compact slots (e.g. inline empty placeholders) */
  size?: "sm" | "md";
}

const StaticFallback = ({ className }: { className?: string }) => (
  <div
    aria-hidden
    className={className}
    style={{
      background:
        "radial-gradient(60% 60% at 50% 45%, rgba(134, 199, 204, 0.35), transparent 70%), radial-gradient(40% 40% at 50% 60%, rgba(74, 143, 155, 0.25), transparent 75%)",
    }}
  />
);

export const EmptyOrb = ({ className, size = "md" }: EmptyOrbProps) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion() || isLowPowerDevice()) {
      setShouldRender(false);
      return;
    }
    setShouldRender(true);
  }, []);

  if (!shouldRender) {
    return <StaticFallback className={className} />;
  }

  const camZ = size === "sm" ? 3.8 : 3.3;

  return (
    <div className={className} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, camZ], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[2, 3, 3]} intensity={0.7} color="#ffffff" />
        <pointLight position={[-3, 1, -2]} intensity={0.5} color={ACCENT_COLOR} />
        <Suspense fallback={null}>
          <CalmSphere />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default EmptyOrb;
