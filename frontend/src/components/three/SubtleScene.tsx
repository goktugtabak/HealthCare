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

interface GridParticlesProps {
  count: number;
}

/**
 * Loose grid of particles drifting on a single shared time uniform.
 * All animation runs on the GPU — the JS per-frame cost is effectively
 * one uniform write.
 */
const GridParticles = memo(({ count }: GridParticlesProps) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Build a jittered grid: cols × rows ≈ count, with small per-particle
  // offsets so it reads as "loose" rather than a rigid matrix.
  const { positions, seeds } = useMemo(() => {
    const cols = Math.ceil(Math.sqrt(count * 1.6));
    const rows = Math.ceil(count / cols);
    const total = cols * rows;

    const pos = new Float32Array(total * 3);
    const seed = new Float32Array(total);

    const spanX = 12;
    const spanY = 7;
    const cellX = spanX / cols;
    const cellY = spanY / rows;

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const i = r * cols + c;
        const jitterX = (Math.random() - 0.5) * cellX * 0.75;
        const jitterY = (Math.random() - 0.5) * cellY * 0.75;
        const z = (Math.random() - 0.5) * 2.5;

        pos[i * 3] = -spanX / 2 + cellX * (c + 0.5) + jitterX;
        pos[i * 3 + 1] = -spanY / 2 + cellY * (r + 0.5) + jitterY;
        pos[i * 3 + 2] = z;

        seed[i] = Math.random() * Math.PI * 2;
      }
    }

    return { positions: pos, seeds: seed };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(ACCENT_COLOR) },
      uOpacity: { value: 0.2 },
      uSize: { value: 6.5 },
    }),
    [],
  );

  // 5-8 sec drift cycle → ω ≈ 2π / 6.5 ≈ 0.97 rad/sec (spec midpoint)
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const vertexShader = useMemo(
    () => /* glsl */ `
      attribute float aSeed;
      uniform float uTime;
      uniform float uSize;
      varying float vFade;

      void main() {
        vec3 pos = position;
        float t = uTime * 0.97 + aSeed;
        // Very slow, small-amplitude drift (5-8s cycle, ~0.12 unit reach)
        pos.x += sin(t) * 0.12;
        pos.y += cos(t * 0.85) * 0.10;
        pos.z += sin(t * 0.6) * 0.08;

        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mv;
        // Attenuate size with depth and soften far particles
        gl_PointSize = uSize * (12.0 / -mv.z);
        vFade = smoothstep(-3.5, 0.5, mv.z + 4.0);
      }
    `,
    [],
  );

  const fragmentShader = useMemo(
    () => /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vFade;

      void main() {
        // Circular sprite with soft edge — no texture needed
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float alpha = (1.0 - smoothstep(0.25, 0.5, d)) * uOpacity * vFade;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    [],
  );

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSeed"
          count={seeds.length}
          array={seeds}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </points>
  );
});

GridParticles.displayName = "GridParticles";

const ParallaxRig = memo(() => {
  const { camera } = useThree();
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const scrollOffset = useRef(0);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const nx = (event.clientX / window.innerWidth) * 2 - 1;
    const ny = (event.clientY / window.innerHeight) * 2 - 1;
    target.current.x = nx * 0.25;
    target.current.y = -ny * 0.15;
  }, []);

  const handleScroll = useCallback(() => {
    // Normalize scroll so a viewport-height of scroll moves the camera ~0.15u
    scrollOffset.current = (window.scrollY / window.innerHeight) * 0.15;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handlePointerMove, handleScroll]);

  useFrame(() => {
    // 0.05 dampening — matches spec parallax intensity
    current.current.x += (target.current.x - current.current.x) * 0.05;
    current.current.y += (target.current.y - current.current.y) * 0.05;
    camera.position.x = current.current.x;
    camera.position.y = 0.1 + current.current.y - scrollOffset.current;
    camera.lookAt(0, 0, 0);
  });

  return null;
});

ParallaxRig.displayName = "ParallaxRig";

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
        "radial-gradient(55% 85% at 20% 15%, rgba(134, 199, 204, 0.18), transparent 65%), radial-gradient(55% 85% at 85% 80%, rgba(134, 199, 204, 0.12), transparent 65%)",
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

  const particleCount = intensity === "minimal" ? 80 : 95;

  return (
    <div className={className} aria-hidden>
      <Canvas
        camera={{ position: [0, 0.1, 6], fov: 45 }}
        dpr={[1, 1.5]}
        frameloop="always"
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <ParallaxRig />
          <GridParticles count={particleCount} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default SubtleScene;
