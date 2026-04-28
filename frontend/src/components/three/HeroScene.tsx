import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ContactShadows, Trail } from "@react-three/drei";
import * as THREE from "three";

const ENGINEER_COLOR = new THREE.Color("#4f46e5"); // Indigo
const HEALTHCARE_COLOR = new THREE.Color("#0d9488"); // Teal
const ACCENT_COLOR = new THREE.Color("#38bdf8"); // Sky blue

const ConnectionCore = () => {
  const group = useRef<THREE.Group>(null);
  const orb1 = useRef<THREE.Mesh>(null);
  const orb2 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = t * 0.15;
      group.current.rotation.x = Math.sin(t * 0.2) * 0.2;
    }
    if (orb1.current && orb2.current) {
      // Orbiting logic for the two interacting spheres
      orb1.current.position.x = Math.sin(t * 1.2) * 1.8;
      orb1.current.position.z = Math.cos(t * 1.2) * 1.8;
      orb1.current.position.y = Math.sin(t * 1.5) * 0.8;

      orb2.current.position.x = Math.sin(t * 1.2 + Math.PI) * 1.8;
      orb2.current.position.z = Math.cos(t * 1.2 + Math.PI) * 1.8;
      orb2.current.position.y = Math.sin(t * 1.5 + Math.PI) * 0.8;
    }
  });

  return (
    <group ref={group}>
      {/* Central Premium Glass Core */}
      <Float speed={2.5} rotationIntensity={0.6} floatIntensity={1.2}>
        <mesh>
          <icosahedronGeometry args={[1.3, 1]} />
          <meshPhysicalMaterial
            color="#ffffff"
            transmission={0.95}
            opacity={1}
            metalness={0.1}
            roughness={0.05}
            ior={1.5}
            thickness={2.5}
            specularIntensity={1}
            clearcoat={1}
            wireframe={false}
          />
        </mesh>
        {/* Inner wireframe geometric structure */}
        <mesh>
          <icosahedronGeometry args={[1.31, 0]} />
          <meshBasicMaterial color={ACCENT_COLOR} wireframe transparent opacity={0.15} />
        </mesh>
        {/* Inner glowing energy core */}
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshBasicMaterial color={ACCENT_COLOR} transparent opacity={0.7} />
        </mesh>
      </Float>

      {/* Engineer Orb with Trail */}
      <Trail width={1.5} length={4} color={ENGINEER_COLOR} attenuation={(t) => t * t}>
        <mesh ref={orb1}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color={ENGINEER_COLOR} emissive={ENGINEER_COLOR} emissiveIntensity={2.5} toneMapped={false} />
        </mesh>
      </Trail>

      {/* Healthcare Orb with Trail */}
      <Trail width={1.5} length={4} color={HEALTHCARE_COLOR} attenuation={(t) => t * t}>
        <mesh ref={orb2}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color={HEALTHCARE_COLOR} emissive={HEALTHCARE_COLOR} emissiveIntensity={2.5} toneMapped={false} />
        </mesh>
      </Trail>
      
      {/* Abstract Tech Rings */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.6, 2.62, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <ringGeometry args={[3.0, 3.02, 64]} />
        <meshBasicMaterial color={ACCENT_COLOR} transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 5, Math.PI / 6, Math.PI / 4]}>
        <ringGeometry args={[3.4, 3.41, 64]} />
        <meshBasicMaterial color={ENGINEER_COLOR} transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const AmbientParticles = ({ count = 80 }) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -20 + Math.random() * 40;
      const yFactor = -20 + Math.random() * 40;
      const zFactor = -20 + Math.random() * 40;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      dummy.position.set(
        (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      dummy.scale.set(s, s, s);
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current!.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.015, 6, 6]} />
      <meshBasicMaterial color={ACCENT_COLOR} transparent opacity={0.6} />
    </instancedMesh>
  );
};

const HeroScene = () => (
  <Canvas
    camera={{ position: [0, 0, 8.5], fov: 45 }}
    dpr={[1, 1.5]}
    gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
    style={{ background: "transparent" }}
  >
    <ambientLight intensity={0.4} />
    <spotLight position={[10, 15, 10]} angle={0.2} penumbra={1} intensity={1.5} color="#ffffff" />
    <pointLight position={[-10, -10, -10]} intensity={1} color={ENGINEER_COLOR} />
    
    <Suspense fallback={null}>
      <ConnectionCore />
      <AmbientParticles count={75} />
      <Environment preset="city" />
      <ContactShadows position={[0, -3.5, 0]} opacity={0.4} scale={20} blur={2} far={4} color="#000000" resolution={512} />
    </Suspense>
  </Canvas>
);

export default HeroScene;
