import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

const ENGINEER_COLOR = "#1b3a5b";
const HEALTHCARE_COLOR = "#4a8f9b";
const ACCENT_COLOR = "#86c7cc";

const Nucleus = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.25;
    groupRef.current.rotation.x += delta * 0.08;
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.9}>
        <mesh position={[-1.35, 0.1, 0]} castShadow>
          <sphereGeometry args={[0.85, 64, 64]} />
          <MeshDistortMaterial
            color={ENGINEER_COLOR}
            distort={0.32}
            speed={1.4}
            roughness={0.25}
            metalness={0.45}
          />
        </mesh>
        <mesh position={[1.35, -0.1, 0]} castShadow>
          <sphereGeometry args={[0.85, 64, 64]} />
          <MeshDistortMaterial
            color={HEALTHCARE_COLOR}
            distort={0.4}
            speed={1.9}
            roughness={0.2}
            metalness={0.4}
          />
        </mesh>
      </Float>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.95, 0.06, 20, 128]} />
        <meshStandardMaterial
          color={ACCENT_COLOR}
          emissive={ACCENT_COLOR}
          emissiveIntensity={0.65}
        />
      </mesh>
      <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[2.3, 0.03, 16, 128]} />
        <meshStandardMaterial
          color={ACCENT_COLOR}
          emissive={ACCENT_COLOR}
          emissiveIntensity={0.35}
          transparent
          opacity={0.55}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 5, Math.PI / 6, Math.PI / 4]}>
        <torusGeometry args={[2.6, 0.02, 16, 128]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={ACCENT_COLOR}
          emissiveIntensity={0.25}
          transparent
          opacity={0.35}
        />
      </mesh>
    </group>
  );
};

const FloatingParticles = ({ count = 220 }: { count?: number }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 3 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = radius * Math.cos(phi) * 0.55;
      arr[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.04;
    pointsRef.current.rotation.x += delta * 0.015;
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
        size={0.045}
        color={ACCENT_COLOR}
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

const HeroScene = () => (
  <Canvas
    camera={{ position: [0, 0.2, 6.2], fov: 45 }}
    dpr={[1, 2]}
    gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
    style={{ background: "transparent" }}
  >
    <ambientLight intensity={0.55} />
    <directionalLight position={[4, 5, 4]} intensity={1.1} color="#ffffff" />
    <pointLight position={[-5, 2, -4]} intensity={1.2} color={HEALTHCARE_COLOR} />
    <pointLight position={[5, -3, 2]} intensity={0.9} color={ENGINEER_COLOR} />
    <Suspense fallback={null}>
      <Nucleus />
      <FloatingParticles />
    </Suspense>
  </Canvas>
);

export default HeroScene;
