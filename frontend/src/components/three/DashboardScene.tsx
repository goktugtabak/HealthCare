import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, Stars, Sparkles } from "@react-three/drei";
import * as THREE from "three";

const ENGINEER_COLOR = new THREE.Color("#4f46e5"); // Indigo
const HEALTHCARE_COLOR = new THREE.Color("#0d9488"); // Teal
const ACCENT_COLOR = new THREE.Color("#38bdf8"); // Sky blue

const CyberNetwork = () => {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = t * 0.15;
      group.current.rotation.x = Math.sin(t * 0.1) * 0.1;
    }
  });

  return (
    <group ref={group} position={[3, 0, 0]}> {/* Shifted to the right */}
      {/* Central Premium Glass Knot */}
      <Float speed={2.5} rotationIntensity={0.8} floatIntensity={1.5}>
        <mesh>
          <torusKnotGeometry args={[1.2, 0.4, 128, 32]} />
          <meshPhysicalMaterial
            color="#ffffff"
            transmission={0.95}
            opacity={1}
            metalness={0.3}
            roughness={0.05}
            ior={1.5}
            thickness={3}
            specularIntensity={1}
            clearcoat={1}
          />
        </mesh>
        
        {/* Core Energy */}
        <mesh>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshBasicMaterial color={ACCENT_COLOR} transparent opacity={0.5} />
        </mesh>
        
        {/* Wireframe shell */}
        <mesh>
          <torusKnotGeometry args={[1.22, 0.4, 64, 16]} />
          <meshBasicMaterial color={HEALTHCARE_COLOR} wireframe transparent opacity={0.15} />
        </mesh>
      </Float>

      {/* Orbiting Elements representing Co-creation */}
      <OrbitingNode index={0} total={3} color={ENGINEER_COLOR} radius={3.2} speed={0.8} />
      <OrbitingNode index={1} total={3} color={HEALTHCARE_COLOR} radius={2.8} speed={1.2} />
      <OrbitingNode index={2} total={3} color={ACCENT_COLOR} radius={3.5} speed={0.5} />
    </group>
  );
};

const OrbitingNode = ({ index, total, color, radius, speed }: { index: number; total: number; color: THREE.Color; radius: number; speed: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    const angle = (index / total) * Math.PI * 2 + t;
    
    if (meshRef.current) {
      meshRef.current.position.x = Math.cos(angle) * radius;
      meshRef.current.position.z = Math.sin(angle) * radius;
      meshRef.current.position.y = Math.sin(t * 2 + index) * 0.8;
      
      meshRef.current.rotation.x += 0.05;
      meshRef.current.rotation.y += 0.05;
    }
  });

  return (
    <group ref={trailRef}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.35]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
    </group>
  );
};

interface DashboardSceneProps {
  className?: string;
}

const DashboardScene = ({ className }: DashboardSceneProps) => (
  <div className={className} aria-hidden>
    <Canvas
      camera={{ position: [0, 0, 8], fov: 45 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.6} />
      <spotLight position={[5, 10, 5]} intensity={3} color="#ffffff" penumbra={1} />
      <pointLight position={[-5, -5, -5]} intensity={2} color={ACCENT_COLOR} />
      
      <Suspense fallback={null}>
        <CyberNetwork />
        <Sparkles count={150} scale={12} size={1.5} speed={0.4} opacity={0.3} color={ACCENT_COLOR} />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  </div>
);

export default DashboardScene;
