import {
  Suspense,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const ENGINEER_COLOR = "#1b3a5b";
const HEALTHCARE_COLOR = "#4a8f9b";
const ACCENT_COLOR = "#86c7cc";
const WARM_RIM_COLOR = "#ffaa55";

const PALETTE = [
  new THREE.Color(ENGINEER_COLOR),
  new THREE.Color(HEALTHCARE_COLOR),
  new THREE.Color(ACCENT_COLOR),
];

type NodeShape = "sphere" | "cube";

interface NodeDef {
  id: number;
  position: [number, number, number];
  shape: NodeShape;
  size: number;
  color: THREE.Color;
  rotationSpeed: [number, number, number];
  bobAmplitude: number;
  bobFrequency: number;
  bobPhase: number;
  driftAmplitude: number;
  driftFrequency: number;
  driftPhase: number;
}

const NODE_COUNT = 11;
const CONNECTION_MAX_DISTANCE = 4;

const seeded = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

const gradientColor = (t: number) => {
  const clamped = Math.min(Math.max(t, 0), 1);
  if (clamped < 0.5) {
    return PALETTE[0].clone().lerp(PALETTE[1], clamped * 2);
  }
  return PALETTE[1].clone().lerp(PALETTE[2], (clamped - 0.5) * 2);
};

const buildNodes = (): NodeDef[] => {
  const rand = seeded(42);
  const nodes: NodeDef[] = [];

  for (let i = 0; i < NODE_COUNT; i += 1) {
    const t = i / (NODE_COUNT - 1);

    const x = (rand() - 0.5) * 7.5;
    const y = (rand() - 0.5) * 4.2;
    const z = (rand() - 0.5) * 3.5 - 0.5;

    // 15-45s per full rotation → 2π / period rad/sec, independent per axis.
    const periodX = 15 + rand() * 30;
    const periodY = 15 + rand() * 30;
    const periodZ = 15 + rand() * 30;

    nodes.push({
      id: i,
      position: [x, y, z],
      shape: rand() > 0.55 ? "sphere" : "cube",
      size: 0.22 + rand() * 0.35,
      color: gradientColor(t + (rand() - 0.5) * 0.15),
      rotationSpeed: [
        (Math.PI * 2) / periodX,
        (Math.PI * 2) / periodY,
        (Math.PI * 2) / periodZ,
      ],
      bobAmplitude: 0.3 + rand() * 0.2, // 0.3-0.5 units (spec max 0.5)
      bobFrequency: 0.25 + rand() * 0.35, // unique per-node cadence
      bobPhase: rand() * Math.PI * 2,
      driftAmplitude: 0.08 + rand() * 0.14,
      driftFrequency: 0.18 + rand() * 0.22,
      driftPhase: rand() * Math.PI * 2,
    });
  }

  return nodes;
};

interface FloatingNodeProps {
  node: NodeDef;
  meshRef: (mesh: THREE.Mesh | null) => void;
  simpleMaterial: boolean;
}

const FloatingNode = memo(({ node, meshRef, simpleMaterial }: FloatingNodeProps) => {
  const innerRef = useRef<THREE.Mesh>(null);
  const basePosition = useMemo(
    () => new THREE.Vector3(...node.position),
    [node.position],
  );

  const setRef = useCallback(
    (mesh: THREE.Mesh | null) => {
      innerRef.current = mesh;
      meshRef(mesh);
    },
    [meshRef],
  );

  useFrame((state, delta) => {
    const mesh = innerRef.current;
    if (!mesh) return;

    mesh.rotation.x += node.rotationSpeed[0] * delta;
    mesh.rotation.y += node.rotationSpeed[1] * delta;
    mesh.rotation.z += node.rotationSpeed[2] * delta;

    const t = state.clock.getElapsedTime();
    mesh.position.y =
      basePosition.y +
      Math.sin(t * node.bobFrequency + node.bobPhase) * node.bobAmplitude;
    mesh.position.x =
      basePosition.x +
      Math.cos(t * node.driftFrequency + node.driftPhase) * node.driftAmplitude;
    mesh.position.z =
      basePosition.z +
      Math.sin(t * node.driftFrequency * 0.7 + node.driftPhase) *
        node.driftAmplitude *
        0.6;
  });

  const segments = simpleMaterial ? 16 : 32;

  return (
    <mesh ref={setRef} position={node.position}>
      {node.shape === "sphere" ? (
        <sphereGeometry args={[node.size, segments, segments]} />
      ) : (
        <boxGeometry args={[node.size * 1.4, node.size * 1.4, node.size * 1.4]} />
      )}
      {simpleMaterial ? (
        <meshLambertMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={0.3}
        />
      ) : (
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={0.3}
          roughness={0.35}
          metalness={0.5}
        />
      )}
    </mesh>
  );
});

FloatingNode.displayName = "FloatingNode";

interface ConnectionLinesProps {
  nodes: NodeDef[];
  nodeMeshes: React.MutableRefObject<(THREE.Mesh | null)[]>;
}

const ConnectionLines = memo(({ nodes, nodeMeshes }: ConnectionLinesProps) => {
  // Pairs are computed once from base positions; pairs that can ever fall
  // within CONNECTION_MAX_DISTANCE at rest are kept, then updated per-frame
  // from live mesh positions.
  const pairs = useMemo(() => {
    const result: Array<[number, number]> = [];
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const dx = nodes[i].position[0] - nodes[j].position[0];
        const dy = nodes[i].position[1] - nodes[j].position[1];
        const dz = nodes[i].position[2] - nodes[j].position[2];
        // Include a small margin so bobbing can bring pairs into range.
        const d = Math.hypot(dx, dy, dz);
        if (d < CONNECTION_MAX_DISTANCE + 0.8) {
          result.push([i, j]);
        }
      }
    }
    return result;
  }, [nodes]);

  const positions = useMemo(
    () => new Float32Array(pairs.length * 6),
    [pairs.length],
  );

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage),
    );
    return geo;
  }, [positions]);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: ACCENT_COLOR,
        transparent: true,
        opacity: 0.4, // spec: 0.35-0.45
      }),
    [],
  );

  const lines = useMemo(
    () => new THREE.LineSegments(geometry, material),
    [geometry, material],
  );

  const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
  const maxDistSq = CONNECTION_MAX_DISTANCE * CONNECTION_MAX_DISTANCE;

  useFrame(() => {
    const meshes = nodeMeshes.current;
    let writeIndex = 0;

    for (let p = 0; p < pairs.length; p += 1) {
      const [i, j] = pairs[p];
      const a = meshes[i];
      const b = meshes[j];
      if (!a || !b) continue;

      const dx = a.position.x - b.position.x;
      const dy = a.position.y - b.position.y;
      const dz = a.position.z - b.position.z;
      if (dx * dx + dy * dy + dz * dz > maxDistSq) continue;

      positions[writeIndex] = a.position.x;
      positions[writeIndex + 1] = a.position.y;
      positions[writeIndex + 2] = a.position.z;
      positions[writeIndex + 3] = b.position.x;
      positions[writeIndex + 4] = b.position.y;
      positions[writeIndex + 5] = b.position.z;
      writeIndex += 6;
    }

    // Collapse unused segments to a single point so they render as nothing.
    for (let k = writeIndex; k < positions.length; k += 1) {
      positions[k] = 0;
    }

    posAttr.needsUpdate = true;
    geometry.setDrawRange(0, (writeIndex / 3) | 0);
  });

  return <primitive object={lines} />;
});

ConnectionLines.displayName = "ConnectionLines";

const ParallaxCamera = () => {
  const { camera } = useThree();
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const nx = (event.clientX / window.innerWidth) * 2 - 1;
    const ny = (event.clientY / window.innerHeight) * 2 - 1;
    // spec: 0.05 intensity baseline, scaled up just enough to read on screen
    target.current.x = nx * 0.35;
    target.current.y = -ny * 0.2;
  }, []);

  useFrame(() => {
    // Dampened easing — 0.05 smoothing factor
    current.current.x += (target.current.x - current.current.x) * 0.05;
    current.current.y += (target.current.y - current.current.y) * 0.05;
    camera.position.x = current.current.x;
    camera.position.y = 0.2 + current.current.y;
    camera.lookAt(0, 0, 0);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [handlePointerMove]);

  return null;
};

interface FpsMonitorProps {
  onLowFps: () => void;
}

const FpsMonitor = ({ onLowFps }: FpsMonitorProps) => {
  const frameCount = useRef(0);
  const lastSample = useRef(performance.now());
  const lowSamples = useRef(0);
  const triggered = useRef(false);

  useFrame(() => {
    frameCount.current += 1;
    const now = performance.now();
    const elapsed = now - lastSample.current;

    if (elapsed >= 1000) {
      const fps = (frameCount.current * 1000) / elapsed;
      // eslint-disable-next-line no-console
      console.log(`[HeroScene] FPS: ${fps.toFixed(1)}`);

      if (fps < 60) {
        lowSamples.current += 1;
      } else {
        lowSamples.current = 0;
      }

      // Require 3 consecutive low samples before degrading — avoids one-off hitches.
      if (!triggered.current && lowSamples.current >= 3) {
        triggered.current = true;
        onLowFps();
      }

      frameCount.current = 0;
      lastSample.current = now;
    }
  });

  return null;
};

const Scene = memo(() => {
  const nodes = useMemo(() => buildNodes(), []);
  const nodeMeshes = useRef<(THREE.Mesh | null)[]>(
    Array.from({ length: nodes.length }, () => null),
  );
  const [degraded, setDegraded] = useState(false);

  const registerMesh = useCallback(
    (index: number) => (mesh: THREE.Mesh | null) => {
      nodeMeshes.current[index] = mesh;
    },
    [],
  );

  const handleLowFps = useCallback(() => {
    // eslint-disable-next-line no-console
    console.warn("[HeroScene] FPS <60 sustained — switching to simplified materials");
    setDegraded(true);
  }, []);

  return (
    <>
      {/* Reduced ambient for more drama */}
      <ambientLight intensity={0.35} />

      {/* Cool front directional (healthcare teal) */}
      <directionalLight
        position={[0, 1.5, 6]}
        intensity={0.9}
        color={HEALTHCARE_COLOR}
      />

      {/* Warm rim light from behind/above */}
      <directionalLight
        position={[-3, 4, -5]}
        intensity={0.2}
        color={WARM_RIM_COLOR}
      />

      {/* Engineer-tone fill from opposite side */}
      <pointLight position={[5, -2, 2]} intensity={0.5} color={ENGINEER_COLOR} />

      <ParallaxCamera />
      <FpsMonitor onLowFps={handleLowFps} />
      <ConnectionLines nodes={nodes} nodeMeshes={nodeMeshes} />
      {nodes.map((node, i) => (
        <FloatingNode
          key={node.id}
          node={node}
          meshRef={registerMesh(i)}
          simpleMaterial={degraded}
        />
      ))}
    </>
  );
});

Scene.displayName = "Scene";

const HeroScene = () => (
  <Canvas
    camera={{ position: [0, 0.2, 7], fov: 45 }}
    dpr={[1, 2]}
    gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
    style={{ background: "transparent" }}
  >
    <Suspense fallback={null}>
      <Scene />
    </Suspense>
  </Canvas>
);

export default HeroScene;
