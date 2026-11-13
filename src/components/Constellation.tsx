import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef } from "react";
import type { MotionValue } from "framer-motion";

/* Scroll progress 0..1 drives the whole scene. Stars hold still until HOLD,
   converge until MERGE, then the merged spark flares. */
const HOLD = 0.12;
const MERGE = 0.78;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};

function makeGlow() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.2, "rgba(255,255,255,0.55)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.12)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function makeDot() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.3, "rgba(255,255,255,0.9)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/* Four-point star: a diamond whose sides curve inward. */
function starShape(R: number, k = 0.13) {
  const s = new THREE.Shape();
  const c = R * k;
  s.moveTo(0, R);
  s.quadraticCurveTo(c, c, R, 0);
  s.quadraticCurveTo(c, -c, 0, -R);
  s.quadraticCurveTo(-c, -c, -R, 0);
  s.quadraticCurveTo(-c, c, 0, R);
  return s;
}

type SceneProps = { progress: MotionValue<number>; reduced: boolean; small: boolean };

/* Background network spread over the whole viewport. */
function Network({ count, reduced, p }: { count: number; reduced: boolean; p: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const pointsMat = useRef<THREE.PointsMaterial>(null);
  const lineMat = useRef<THREE.LineBasicMaterial>(null);
  const dot = useMemo(makeDot, []);
  const { viewport } = useThree();

  const { positions, linePositions, lineColors } = useMemo(() => {
    const w = Math.max(viewport.width, 12) * 0.75;
    const h = Math.max(viewport.height, 8) * 0.75;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      pts.push(
        new THREE.Vector3((Math.random() * 2 - 1) * w, (Math.random() * 2 - 1) * h, Math.random() * 7 - 4.5),
      );
    }
    const positions = new Float32Array(count * 3);
    pts.forEach((v, i) => v.toArray(positions, i * 3));
    const segs: number[] = [];
    const cols: number[] = [];
    const maxD = 2.7;
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
    return { positions, linePositions: new Float32Array(segs), lineColors: new Float32Array(cols) };
  }, [count, viewport.width, viewport.height]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = smooth((p.current - HOLD) / (MERGE - HOLD));
    const drift = reduced ? 0 : state.clock.elapsedTime * 0.02;
    const tx = -state.pointer.y * 0.08;
    const ty = drift + state.pointer.x * 0.12;
    g.rotation.x += (tx - g.rotation.x) * 0.04;
    g.rotation.y += (ty - g.rotation.y) * 0.04;
    const s = 1 - 0.35 * t;
    g.scale.setScalar(s);
    if (pointsMat.current) pointsMat.current.opacity = 0.9 - 0.45 * t;
    if (lineMat.current) lineMat.current.opacity = 0.5 - 0.3 * t;
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={pointsMat}
          size={0.13}
          map={dot}
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
          ref={lineMat}
          color="#1e5bd6"
          vertexColors
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

/* One glowing white star. Flies from `from` to `to` as the page scrolls. */
function Star({
  from,
  to,
  r,
  idx,
  p,
  reduced,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  r: number;
  idx: number;
  p: React.MutableRefObject<number>;
  reduced: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const glow = useMemo(makeGlow, []);
  const geo = useMemo(() => new THREE.ShapeGeometry(starShape(1), 24), []);
  const perp = useMemo(() => {
    const d = new THREE.Vector3().subVectors(to, from);
    return new THREE.Vector3(-d.y, d.x, 0).normalize().multiplyScalar(d.length() * 0.18 * (idx % 2 ? -1 : 1));
  }, [from, to, idx]);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const time = state.clock.elapsedTime;
    const t = smooth((p.current - HOLD) / (MERGE - HOLD));
    tmp.lerpVectors(from, to, t).addScaledVector(perp, Math.sin(t * Math.PI));
    g.position.copy(tmp);
    const twinkle = reduced ? 1 : 1 + 0.04 * Math.sin(time * 1.6 + idx * 2.1);
    const size = r * (1 - 0.6 * t) * twinkle;
    g.scale.setScalar(size);
    g.rotation.z = (reduced ? 0 : time * 0.12 * (idx % 2 ? -1 : 1)) + t * Math.PI * 0.5;
  });

  return (
    <group ref={group}>
      <sprite scale={[7, 7, 1]}>
        <spriteMaterial map={glow} color="#1e5bd6" transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite scale={[2.6, 2.6, 1]}>
        <spriteMaterial map={glow} color="#bfd6ff" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <mesh geometry={geo}>
        <meshBasicMaterial color="#ffffff" fog={false} />
      </mesh>
    </group>
  );
}

/* The flare that appears once the three stars have become one. */
function Spark({ at, u, p }: { at: THREE.Vector3; u: number; p: React.MutableRefObject<number> }) {
  const glow = useMemo(makeGlow, []);
  const core = useRef<THREE.Sprite>(null);
  const halo = useRef<THREE.Sprite>(null);
  useFrame((state) => {
    const t = smooth((p.current - (MERGE - 0.06)) / 0.2);
    const pulse = 1 + 0.06 * Math.sin(state.clock.elapsedTime * 3);
    if (core.current) {
      core.current.scale.setScalar(u * 2.2 * t * pulse);
      (core.current.material as THREE.SpriteMaterial).opacity = t;
    }
    if (halo.current) {
      halo.current.scale.setScalar(u * 10 * t);
      (halo.current.material as THREE.SpriteMaterial).opacity = 0.7 * t;
    }
  });
  return (
    <group position={at}>
      <sprite ref={halo} scale={[0, 0, 1]}>
        <spriteMaterial map={glow} color="#1e5bd6" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite ref={core} scale={[0, 0, 1]}>
        <spriteMaterial map={glow} color="#ffffff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

/* A quiet ringed planet in the lower corner. */
function Planet({ pos, r, p }: { pos: THREE.Vector3; r: number; p: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    g.position.set(pos.x, pos.y + p.current * r * 0.9, pos.z);
    g.rotation.y = state.clock.elapsedTime * 0.02;
  });
  return (
    <group ref={group} position={pos}>
      <mesh>
        <sphereGeometry args={[r, 64, 64]} />
        <meshStandardMaterial color="#082050" roughness={0.95} metalness={0} />
      </mesh>
      <mesh scale={1.03}>
        <sphereGeometry args={[r, 64, 64]} />
        <meshBasicMaterial color="#1e5bd6" transparent opacity={0.18} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <group rotation={[1.3, 0.25, 0.35]}>
        <mesh>
          <ringGeometry args={[r * 1.4, r * 1.95, 128]} />
          <meshBasicMaterial color="#bfd6ff" transparent opacity={0.22} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh>
          <ringGeometry args={[r * 2.02, r * 2.14, 128]} />
          <meshBasicMaterial color="#bfd6ff" transparent opacity={0.1} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

function Scene({ progress, reduced, small }: SceneProps) {
  const { viewport } = useThree();
  const p = useRef(0);
  const cur = useRef(0);

  // Ease toward the scroll value so the motion stays silky even on fast wheels.
  useFrame((_, dt) => {
    const target = progress.get();
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 9);
    cur.current += (target - cur.current) * k;
    p.current = cur.current;
  });

  const vw = viewport.width;
  const vh = viewport.height;
  const u = Math.min(vw, vh * 1.4) / 10;

  const layout = useMemo(() => {
    const target = new THREE.Vector3(small ? 0 : vw * 0.12, small ? vh * 0.12 : 0.1, 0.5);
    const stars = small
      ? [
          { from: new THREE.Vector3(vw * 0.16, vh * 0.33, 0.4), r: u * 0.95 },
          { from: new THREE.Vector3(-vw * 0.3, vh * 0.41, -0.6), r: u * 0.5 },
          { from: new THREE.Vector3(vw * 0.4, vh * 0.44, -0.8), r: u * 0.42 },
        ]
      : [
          { from: new THREE.Vector3(vw * 0.25, vh * 0.06, 0.4), r: u * 0.62 },
          { from: new THREE.Vector3(vw * 0.43, -vh * 0.26, -0.8), r: u * 0.34 },
          { from: new THREE.Vector3(vw * 0.38, vh * 0.36, -1.2), r: u * 0.27 },
        ];
    const planet = {
      pos: new THREE.Vector3(small ? vw * 0.5 : vw * 0.42, small ? -vh * 0.66 : -vh * 0.6, -3),
      r: small ? u * 3 : u * 2.2,
    };
    return { target, stars, planet };
  }, [vw, vh, u, small]);

  return (
    <>
      <fog attach="fog" args={["#050608", 10, 24]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[-8, 7, 5]} intensity={1.5} color="#bfd6ff" />
      <Planet pos={layout.planet.pos} r={layout.planet.r} p={p} />
      <Network count={small ? 220 : 520} reduced={reduced} p={p} />
      {layout.stars.map((s, i) => (
        <Star key={i} idx={i} from={s.from} to={layout.target} r={s.r} p={p} reduced={reduced} />
      ))}
      <Spark at={layout.target} u={u} p={p} />
    </>
  );
}

export default function Constellation({ progress }: { progress: MotionValue<number> }) {
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 11], fov: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Scene progress={progress} reduced={reduced} small={small} />
    </Canvas>
  );
}
