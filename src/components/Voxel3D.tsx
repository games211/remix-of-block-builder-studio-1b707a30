import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Voxels } from "@/lib/shapes";

interface Props {
  voxels: Voxels;
  highlightLayer?: number;
  isolateLayer?: boolean;
}

function readColor(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function Voxel3D({ voxels, highlightLayer, isolateLayer = false }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    group: THREE.Group;
    raf: number;
    rotating: boolean;
    pointer: { x: number; y: number; down: boolean; lx: number; ly: number };
    rot: { x: number; y: number };
    distance: number;
    cleanup: () => void;
  } | null>(null);

  // Setup scene once
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(40, 80, 60);
    scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.35);
    dir2.position.set(-50, -20, -40);
    scene.add(dir2);

    const group = new THREE.Group();
    scene.add(group);

    const state = {
      renderer,
      scene,
      camera,
      group,
      raf: 0,
      rotating: true,
      pointer: { x: 0, y: 0, down: false, lx: 0, ly: 0 },
      rot: { x: -0.5, y: 0.7 },
      distance: 60,
      cleanup: () => {},
    };

    const onDown = (e: PointerEvent) => {
      state.pointer.down = true;
      state.pointer.lx = e.clientX;
      state.pointer.ly = e.clientY;
      state.rotating = false;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!state.pointer.down) return;
      const dx = e.clientX - state.pointer.lx;
      const dy = e.clientY - state.pointer.ly;
      state.pointer.lx = e.clientX;
      state.pointer.ly = e.clientY;
      state.rot.y -= dx * 0.01;
      state.rot.x -= dy * 0.01;
      state.rot.x = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, state.rot.x));
    };
    const onUp = (e: PointerEvent) => {
      state.pointer.down = false;
      try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {/* ignore */}
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      state.distance *= 1 + e.deltaY * 0.001;
      state.distance = Math.max(5, Math.min(500, state.distance));
    };
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    const tick = () => {
      if (state.rotating) state.rot.y += 0.003;
      const cx = Math.cos(state.rot.x);
      camera.position.set(
        Math.sin(state.rot.y) * cx * state.distance,
        Math.sin(state.rot.x) * state.distance,
        Math.cos(state.rot.y) * cx * state.distance,
      );
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      state.raf = requestAnimationFrame(tick);
    };
    state.raf = requestAnimationFrame(tick);

    state.cleanup = () => {
      cancelAnimationFrame(state.raf);
      ro.disconnect();
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

  // Rebuild voxel mesh when shape changes
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    // Clear previous children
    while (s.group.children.length) {
      const child = s.group.children.pop()!;
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
      const mat = (child as THREE.Mesh).material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) (mat as THREE.Material).dispose();
    }

    const d = voxels.length;
    if (!d) return;
    const h = voxels[0].length;
    const w = voxels[0][0].length;

    // Count blocks
    let count = 0;
    for (const layer of voxels) for (const row of layer) for (const c of row) if (c) count++;
    if (!count) return;

    const filled = readColor("--grid-filled", "oklch(0.58 0.19 265)");
    const highlightCol = readColor("--accent", "oklch(0.92 0.05 200)");

    const geom = new THREE.BoxGeometry(1, 1, 1);
    const tex = new THREE.TextureLoader().load("/textures/blocks/stone_bricks.png");
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    const baseMat = new THREE.MeshStandardMaterial({
      map: tex,
      color: new THREE.Color(0xffffff),
      roughness: 0.85,
      metalness: 0.05,
    });
    const hlMat = new THREE.MeshStandardMaterial({
      map: tex,
      color: new THREE.Color(highlightCol),
      emissive: new THREE.Color(filled),
      emissiveIntensity: 0.35,
      roughness: 0.6,
    });

    // Two instanced meshes: base + highlight (current layer)
    const hlIdx = highlightLayer !== undefined ? Math.max(0, Math.min(d - 1, highlightLayer)) : -1;

    let baseCount = 0;
    let hlCount = 0;
    for (let z = 0; z < d; z++) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (!voxels[z][y][x]) continue;
          if (isolateLayer && hlIdx >= 0 && z !== hlIdx) continue;
          if (z === hlIdx && !isolateLayer) hlCount++;
          else baseCount++;
        }
      }
    }

    const baseMesh = new THREE.InstancedMesh(geom, baseMat, baseCount);
    const hlMesh = hlCount > 0 ? new THREE.InstancedMesh(geom, hlMat, hlCount) : null;

    const m = new THREE.Matrix4();
    let bi = 0;
    let hi = 0;
    const ox = (w - 1) / 2;
    const oy = (h - 1) / 2;
    const oz = (d - 1) / 2;
    for (let z = 0; z < d; z++) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (!voxels[z][y][x]) continue;
          if (isolateLayer && hlIdx >= 0 && z !== hlIdx) continue;
          // Map: world Y = layer (z) so layers stack vertically
          m.makeTranslation(x - ox, z - oz, y - oy);
          if (z === hlIdx && !isolateLayer && hlMesh) {
            hlMesh.setMatrixAt(hi++, m);
          } else {
            baseMesh.setMatrixAt(bi++, m);
          }
        }
      }
    }
    baseMesh.instanceMatrix.needsUpdate = true;
    s.group.add(baseMesh);
    if (hlMesh) {
      hlMesh.instanceMatrix.needsUpdate = true;
      s.group.add(hlMesh);
    }

    // Auto-fit camera distance based on bounding size
    const maxDim = Math.max(w, h, d);
    s.distance = Math.max(20, maxDim * 2.2);
  }, [voxels, highlightLayer, isolateLayer]);

  const resetView = () => {
    const s = stateRef.current;
    if (!s) return;
    s.rot.x = -0.5;
    s.rot.y = 0.7;
    const d = voxels.length;
    const maxDim = Math.max(voxels[0]?.[0]?.length ?? 1, voxels[0]?.length ?? 1, d);
    s.distance = Math.max(20, maxDim * 2.2);
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
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}
