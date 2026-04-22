import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

const ENGINEER_COLOR = "#1b3a5b";
const HEALTHCARE_COLOR = "#4a8f9b";
const ACCENT_COLOR = "#86c7cc";

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
 * Mini DNA helix — two interlocked strands of small spheres connected by
 * thin rungs. Healthcare-coded (bio motif), engineer-coded (mathematical
 * twist), and matches the platform palette.
 */
const Helix = ({ rungCount = 9 }: { rungCount?: number }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.6;
  });

  const rungs = useMemo(
    () => Array.from({ length: rungCount }, (_, index) => index),
    [rungCount],
  );

  const height = 1.6;
  const radius = 0.55;
  const turns = 1.4;

  return (
    <group ref={groupRef}>
      {rungs.map((index) => {
        const t = index / (rungCount - 1);
        const y = (t - 0.5) * height;
        const angle = t * Math.PI * 2 * turns;
        const xA = Math.cos(angle) * radius;
        const zA = Math.sin(angle) * radius;
        const xB = -xA;
        const zB = -zA;

        return (
          <group key={index}>
            <mesh position={[xA, y, zA]}>
              <sphereGeometry args={[0.085, 16, 16]} />
              <meshStandardMaterial
                color={ENGINEER_COLOR}
                roughness={0.3}
                metalness={0.4}
                emissive={ENGINEER_COLOR}
                emissiveIntensity={0.18}
              />
            </mesh>
            <mesh position={[xB, y, zB]}>
              <sphereGeometry args={[0.085, 16, 16]} />
              <meshStandardMaterial
                color={HEALTHCARE_COLOR}
                roughness={0.3}
                metalness={0.4}
                emissive={HEALTHCARE_COLOR}
                emissiveIntensity={0.2}
              />
            </mesh>
            {index % 2 === 0 && (
              <mesh
                position={[0, y, 0]}
                rotation={[0, -angle, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.012, 0.012, radius * 2, 8]} />
                <meshStandardMaterial
                  color={ACCENT_COLOR}
                  emissive={ACCENT_COLOR}
                  emissiveIntensity={0.4}
                  transparent
                  opacity={0.55}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};

/**
 * Pulse ring — soft heartbeat halo around the helix.
 */
const PulseRing = () => {
  const ringRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (!ringRef.current || !materialRef.current) return;
    const elapsed = state.clock.getElapsedTime();
    const pulse = (Math.sin(elapsed * 1.6) + 1) * 0.5;
    const scale = 1 + pulse * 0.08;
    ringRef.current.scale.set(scale, scale, scale);
    materialRef.current.opacity = 0.35 + pulse * 0.35;
    materialRef.current.emissiveIntensity = 0.4 + pulse * 0.4;
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2.2, 0, 0]}>
      <torusGeometry args={[1.35, 0.018, 14, 96]} />
      <meshStandardMaterial
        ref={materialRef}
        color={ACCENT_COLOR}
        emissive={ACCENT_COLOR}
        emissiveIntensity={0.5}
        transparent
        opacity={0.55}
      />
    </mesh>
  );
};

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

  const camZ = size === "sm" ? 4.6 : 4;

  return (
    <div className={className} aria-hidden>
      <Canvas
        camera={{ position: [0, 0.1, camZ], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 3, 3]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-3, 1, -2]} intensity={0.6} color={HEALTHCARE_COLOR} />
        <Suspense fallback={null}>
          <Float speed={0.8} rotationIntensity={0.15} floatIntensity={0.35}>
            <Helix />
          </Float>
          <PulseRing />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default EmptyOrb;
