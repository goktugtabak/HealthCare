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

const Orbs = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.12;
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.55}>
        <mesh position={[-1.3, 0.2, 0]}>
          <sphereGeometry args={[0.78, 32, 32]} />
          <meshStandardMaterial
            color={ENGINEER_COLOR}
            roughness={0.35}
            metalness={0.35}
          />
        </mesh>
        <mesh position={[1.3, -0.2, 0]}>
          <sphereGeometry args={[0.78, 32, 32]} />
          <meshStandardMaterial
            color={HEALTHCARE_COLOR}
            roughness={0.3}
            metalness={0.35}
          />
        </mesh>
      </Float>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.85, 0.04, 12, 64]} />
        <meshStandardMaterial
          color={ACCENT_COLOR}
          emissive={ACCENT_COLOR}
          emissiveIntensity={0.45}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
};

const DriftParticles = ({ count = 90 }: { count?: number }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 2.8 + Math.random() * 2.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = radius * Math.cos(phi) * 0.5;
      arr[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.03;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color={ACCENT_COLOR}
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

interface SubtleSceneProps {
  intensity?: "minimal" | "standard";
  className?: string;
}

const StaticFallback = ({ className }: { className?: string }) => (
  <div
    aria-hidden
    className={className}
    style={{
      background:
        "radial-gradient(55% 85% at 20% 15%, rgba(134, 199, 204, 0.28), transparent 65%), radial-gradient(55% 85% at 85% 80%, rgba(27, 58, 91, 0.32), transparent 65%)",
    }}
  />
);

const SubtleScene = ({ intensity = "standard", className }: SubtleSceneProps) => {
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

  const particleCount = intensity === "minimal" ? 50 : 90;

  return (
    <div className={className} aria-hidden>
      <Canvas
        camera={{ position: [0, 0.1, 6], fov: 45 }}
        dpr={[1, 1.5]}
        frameloop="always"
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 3]} intensity={0.9} color="#ffffff" />
        <pointLight position={[-4, 2, -3]} intensity={0.8} color={HEALTHCARE_COLOR} />
        <Suspense fallback={null}>
          <Orbs />
          <DriftParticles count={particleCount} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default SubtleScene;
