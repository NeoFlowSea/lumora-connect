import {
  AmbientLight,
  Box3,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { MARK, SHIELD } from "../../components/Logo";

/* The assembled logo as a 3D object behind the hero: the traced shield extruded, turning slowly
   and leaning a little toward the cursor. Loaded with import() only on desktop with motion allowed,
   after the intro finishes, so three.js never delays the first paint. Renders only while visible. */
export type LogoScene = { setActive: (on: boolean) => void; dispose: () => void };

export function mountLogoScene(host: HTMLElement, onReady: () => void): LogoScene {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  host.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 10, 5000);
  camera.position.set(0, 0, 1250);

  scene.add(new AmbientLight(0xffffff, 1.1));
  const key = new DirectionalLight(0xffffff, 1.8);
  key.position.set(-300, 400, 600);
  scene.add(key);

  // blue silhouette behind, white shield with the mark cut out in front
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="154 145 322 392"><path d="${SHIELD}" fill="#3d7bfa"/><path d="${MARK}" fill="#ffffff" fill-rule="evenodd"/></svg>`;
  const data = new SVGLoader().parse(svg);
  const inner = new Group();
  const disposables: { dispose: () => void }[] = [];
  data.paths.forEach((p, i) => {
    const geo = new ExtrudeGeometry(SVGLoader.createShapes(p), {
      depth: i === 0 ? 16 : 26,
      bevelEnabled: true,
      bevelThickness: 2,
      bevelSize: 1.5,
      bevelSegments: 2,
      curveSegments: 10,
    });
    const mat = new MeshStandardMaterial({ color: p.color, roughness: 0.55, metalness: 0.05, side: DoubleSide });
    const mesh = new Mesh(geo, mat);
    mesh.position.z = i === 0 ? -14 : 0;
    inner.add(mesh);
    disposables.push(geo, mat);
  });
  const center = new Box3().setFromObject(inner).getCenter(new Vector3());
  inner.position.set(-center.x, -center.y, 0);
  const logo = new Group();
  logo.add(inner);
  logo.scale.y = -1; // SVG y points down
  scene.add(logo);

  const resize = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  // cursor parallax, eased
  const target = { x: 0, y: 0 };
  const cur = { x: 0, y: 0 };
  const onPointer = (e: PointerEvent) => {
    target.x = e.clientX / window.innerWidth - 0.5;
    target.y = e.clientY / window.innerHeight - 0.5;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  let active = true;
  let onScreen = true;
  let raf = 0;
  let first = true;
  const t0 = performance.now();
  const frame = (now: number) => {
    raf = 0;
    const t = (now - t0) / 1000;
    cur.x += (target.x - cur.x) * 0.04;
    cur.y += (target.y - cur.y) * 0.04;
    logo.rotation.y = Math.sin(t * 0.22) * 0.55 + cur.x * 0.35;
    logo.rotation.x = Math.sin(t * 0.15) * 0.06 + cur.y * 0.2;
    renderer.render(scene, camera);
    if (first) {
      first = false;
      onReady();
    }
    schedule();
  };
  const schedule = () => {
    if (!raf && active && onScreen && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const io = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    schedule();
  });
  io.observe(host);
  const onVisibility = () => schedule();
  document.addEventListener("visibilitychange", onVisibility);
  schedule();

  return {
    setActive(on) {
      active = on;
      schedule();
    },
    dispose() {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      canvas.remove();
    },
  };
}
