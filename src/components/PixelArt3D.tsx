import { useEffect, useRef } from "react";
import * as THREE from "three";
import { blockTexture, blockTint } from "@/lib/blocks";

export type PixelCell = { id: string; hex: string } | null;
export type PixelGrid = PixelCell[][]; // [y][x]

interface Props {
  grid: PixelGrid;
}

const textureCache = new Map<string, THREE.Texture>();
function loadBlockTexture(id: string): THREE.Texture | null {
  const url = blockTexture(id);
  if (!url) return null;
  let t = textureCache.get(url);
  if (!t) {
    t = new THREE.TextureLoader().load(url);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    textureCache.set(url, t);
  }
  return t;
}

export function PixelArt3D({ grid }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    group: THREE.Group;
    raf: number;
    rotating: boolean;
    pointer: { down: boolean; button: number; lx: number; ly: number };
    rot: { x: number; y: number };
    target: THREE.Vector3;
    distance: number;
    cleanup: () => void;
  } | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const w = mount.clientWidth;
    const h = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 5000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dir = new THREE.DirectionalLight(0xffffff, 0.5);
    dir.position.set(50, 80, 60);
    scene.add(dir);

    const group = new THREE.Group();
    scene.add(group);

    const state = {
      renderer, scene, camera, group, raf: 0, rotating: false,
      pointer: { down: false, button: 0, lx: 0, ly: 0 },
      rot: { x: -0.2, y: 0.3 },
      target: new THREE.Vector3(0, 0, 0),
      distance: 100,
      cleanup: () => {},
    };

    const onContext = (e: Event) => e.preventDefault();
    const onDown = (e: PointerEvent) => {
      state.pointer.down = true;
      state.pointer.button = e.button;
      state.pointer.lx = e.clientX; state.pointer.ly = e.clientY;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!state.pointer.down) return;
      const dx = e.clientX - state.pointer.lx;
      const dy = e.clientY - state.pointer.ly;
      state.pointer.lx = e.clientX; state.pointer.ly = e.clientY;
      if (state.pointer.button === 2) {
        // right-click pan
        const panSpeed = state.distance * 0.0015;
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        camera.matrixWorld.extractBasis(right, up, new THREE.Vector3());
        state.target.addScaledVector(right, -dx * panSpeed);
        state.target.addScaledVector(up, dy * panSpeed);
      } else {
        // left-click rotate
        state.rot.y -= dx * 0.01;
        state.rot.x -= dy * 0.01;
        state.rot.x = Math.max(-Math.PI/2 + 0.05, Math.min(Math.PI/2 - 0.05, state.rot.x));
      }
    };
    const onUp = (e: PointerEvent) => {
      state.pointer.down = false;
      try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {/* ignore */}
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      state.distance *= 1 + e.deltaY * 0.001;
      state.distance = Math.max(10, Math.min(2000, state.distance));
    };
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.addEventListener("contextmenu", onContext);
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const onResize = () => {
      const ww = mount.clientWidth, hh = mount.clientHeight;
      renderer.setSize(ww, hh);
      camera.aspect = ww / hh;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    const tick = () => {
      if (state.rotating) state.rot.y += 0.003;
      const cx = Math.cos(state.rot.x);
      camera.position.set(
        state.target.x + Math.sin(state.rot.y) * cx * state.distance,
        state.target.y + Math.sin(state.rot.x) * state.distance,
        state.target.z + Math.cos(state.rot.y) * cx * state.distance,
      );
      camera.lookAt(state.target);
      renderer.render(scene, camera);
      state.raf = requestAnimationFrame(tick);
    };
    state.raf = requestAnimationFrame(tick);

    state.cleanup = () => {
      cancelAnimationFrame(state.raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("contextmenu", onContext);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointercancel", onUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
    stateRef.current = state;
    return () => state.cleanup();
  }, []);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    while (s.group.children.length) {
      const child = s.group.children.pop()!;
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) (mat as THREE.Material).dispose();
    }

    const h = grid.length;
    const w = h ? grid[0].length : 0;
    if (!w || !h) return;

    // Group by block id (so each gets its texture)
    const buckets = new Map<string, { hex: string; positions: [number, number][] }>();
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = grid[y][x];
        if (!c) continue;
        const b = buckets.get(c.id);
        if (b) b.positions.push([x, y]);
        else buckets.set(c.id, { hex: c.hex, positions: [[x, y]] });
      }
    }

    const geom = new THREE.BoxGeometry(1, 1, 1);
    const ox = (w - 1) / 2;
    const oy = (h - 1) / 2;
    const m = new THREE.Matrix4();

    for (const [id, { hex, positions }] of buckets) {
      const tex = loadBlockTexture(id);
      const tint = blockTint(id);
      const matColor = tint
        ? new THREE.Color(tint)
        : tex
        ? new THREE.Color(0xffffff)
        : new THREE.Color(hex);
      const mat = new THREE.MeshStandardMaterial({
        color: matColor,
        map: tex ?? null,
        roughness: 0.85,
        metalness: 0.05,
      });
      const mesh = new THREE.InstancedMesh(geom, mat, positions.length);
      let i = 0;
      for (const [x, y] of positions) {
        m.makeTranslation(x - ox, oy - y, 0);
        mesh.setMatrixAt(i++, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
      s.group.add(mesh);
    }

    const maxDim = Math.max(w, h);
    s.distance = Math.max(20, maxDim * 1.6);
  }, [grid]);

  const resetView = () => {
    const s = stateRef.current;
    if (!s) return;
    s.rot.x = -0.2; s.rot.y = 0.3;
    s.target.set(0, 0, 0);
    const h = grid.length;
    const w = h ? grid[0].length : 0;
    s.distance = Math.max(20, Math.max(w, h) * 1.6);
  };
  const toggleAutoRotate = () => {
    const s = stateRef.current;
    if (!s) return;
    s.rotating = !s.rotating;
  };

  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} className="h-full w-full" />
      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <button
          onClick={toggleAutoRotate}
          className="rounded-md border border-border bg-card/80 px-2.5 py-1 text-xs font-medium backdrop-blur hover:bg-accent"
        >
          Auto-rotate
        </button>
        <button
          onClick={resetView}
          className="rounded-md border border-border bg-card/80 px-2.5 py-1 text-xs font-medium backdrop-blur hover:bg-accent"
        >
          Reset view
        </button>
      </div>
      <div className="absolute bottom-3 left-3 rounded-md bg-card/80 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur border border-border">
        Left-drag to rotate · Right-drag to pan · Scroll to zoom
      </div>
    </div>
  );
}
