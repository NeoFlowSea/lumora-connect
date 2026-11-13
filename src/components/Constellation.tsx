import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef } from "react";

function makeSprite() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,0.9)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function Network({ count, reduced }: { count: number; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const sprite = useMemo(makeSprite, []);

  const { positions, linePositions, lineColors } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const r = Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pts.push(
        new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta) * 9.5,
          r * Math.sin(phi) * Math.sin(theta) * 5,
          r * Math.cos(phi) * 4,
        ),
      );
    }
    const positions = new Float32Array(count * 3);
    pts.forEach((p, i) => p.toArray(positions, i * 3));

    const segs: number[] = [];
    const cols: number[] = [];
    const maxD = 2.1;
    for (let i = 0; i < count; i++) {
      let links = 0;
      for (let j = i + 1; j < count && links < 3; j++) {
        const d = pts[i].distanceTo(pts[j]);
        if (d < maxD) {
          segs.push(...pts[i].toArray(), ...pts[j].toArray());
          const a = 1 - d / maxD;
          cols.push(a, a, a, a, a, a);
          links++;
        }
      }
    }
    return {
      positions,
      linePositions: new Float32Array(segs),
      lineColors: new Float32Array(cols),
    };
  }, [count]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const drift = reduced ? 0 : state.clock.elapsedTime * 0.03;
    const tx = -state.pointer.y * 0.12;
    const ty = drift + state.pointer.x * 0.22;
    g.rotation.x += (tx - g.rotation.x) * 0.04;
    g.rotation.y += (ty - g.rotation.y) * 0.04;
  });

  return (
    <group ref={group} position={[1.6, 0, 0]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.14}
          map={sprite}
          color="#bfd6ff"
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[lineColors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#1e5bd6"
          vertexColors
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      <Hub />
    </group>
  );
}

/* The logo motif: one bright node with three rays, sitting inside the network. */
function Hub() {
  const ref = useRef<THREE.Group>(null);
  const rays = useMemo(() => {
    const ends = [
      new THREE.Vector3(-0.8, 0.75, 0.15),
      new THREE.Vector3(0, 1.05, -0.15),
      new THREE.Vector3(0.8, 0.75, 0.15),
    ];
    const arr = new Float32Array(ends.length * 6);
    ends.forEach((e, i) => {
      arr.set([0, 0, 0, e.x, e.y, e.z], i * 6);
    });
    return { ends, arr };
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.15;
  });

  return (
    <group ref={ref} position={[2.4, 0.1, 2]}>
      <mesh>
        <sphereGeometry args={[0.14, 32, 32]} />
        <meshBasicMaterial color="#f2f5fa" fog={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshBasicMaterial color="#1e5bd6" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshBasicMaterial color="#1e5bd6" transparent opacity={0.07} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[rays.arr, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#bfd6ff" transparent opacity={0.6} fog={false} />
      </lineSegments>
      {rays.ends.map((e, i) => (
        <mesh key={i} position={e}>
          <sphereGeometry args={[0.06, 24, 24]} />
          <meshBasicMaterial color="#f2f5fa" fog={false} />
        </mesh>
      ))}
    </group>
  );
}

export default function Constellation() {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 11], fov: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <fog attach="fog" args={["#050608", 7, 17]} />
      <Network count={small ? 180 : 420} reduced={reduced} />
    </Canvas>
  );
}
