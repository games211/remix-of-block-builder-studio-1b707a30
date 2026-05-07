import { useEffect, useImperativeHandle, useMemo, useRef, forwardRef } from "react";
import * as THREE from "three";

export type BodyPartKey =
  | "head"
  | "body"
  | "rightArm"
  | "leftArm"
  | "rightLeg"
  | "leftLeg";

export type Visibility = Record<BodyPartKey, boolean>;
export type EditTool = "none" | "pencil" | "eraser" | "eyedropper";

export interface SkinViewer3DHandle {
  exportPng: () => string | null;
  getSkinDataUrl: () => string | null;
}

interface Props {
  skinUrl: string | null;
  showOuter: boolean;
  visible: Visibility;
  showGrid: boolean;
  tool: EditTool;
  color: string;
  onPickColor?: (hex: string) => void;
  onEdit?: (newDataUrl: string) => void;
}

/**
 * Sets BoxGeometry UVs from a Minecraft skin atlas.
 * Atlas size = 64x64. Origin (u,v) = top-left of the 4-block UV strip on the texture.
 * (w,h,d) are the box dimensions in texture pixels.
 * Each face also gets a userData.uvRect storing pixel-space rect (x,y,w,h) and orientation,
 * so we can map an intersection back to the texture pixel for painting.
 */
type UvRect = { x: number; y: number; w: number; h: number; flipU?: boolean };

function setSkinBoxUVs(
  geom: THREE.BoxGeometry,
  u: number,
  v: number,
  w: number,
  h: number,
  d: number,
  atlasW = 64,
  atlasH = 64,
): UvRect[] {
  const uvAttr = geom.attributes.uv as THREE.BufferAttribute;

  const rect = (x: number, y: number, rw: number, rh: number) => {
    const u0 = x / atlasW;
    const u1 = (x + rw) / atlasW;
    const v0 = 1 - (y + rh) / atlasH;
    const v1 = 1 - y / atlasH;
    return [u0, v1, u1, v1, u0, v0, u1, v0];
  };

  // Face order: +X, -X, +Y, -Y, +Z, -Z
  const facePixelRects: UvRect[] = [
    { x: u + d + w, y: v + d, w: d, h: h }, // +X left side
    { x: u, y: v + d, w: d, h: h },         // -X right side
    { x: u + d, y: v, w: w, h: d },         // +Y top
    { x: u + d + w, y: v, w: w, h: d },     // -Y bottom (mirrored vertically per MC spec)
    { x: u + d, y: v + d, w: w, h: h },     // +Z front
    { x: u + 2 * d + w, y: v + d, w: w, h: h }, // -Z back
  ];

  let vi = 0;
  for (const r of facePixelRects) {
    const f = rect(r.x, r.y, r.w, r.h);
    for (let k = 0; k < 4; k++) {
      uvAttr.setXY(vi++, f[k * 2], f[k * 2 + 1]);
    }
  }
  uvAttr.needsUpdate = true;
  return facePixelRects;
}

type PartSpec = {
  key: BodyPartKey;
  size: [number, number, number];
  pivot: [number, number, number];
  base: { u: number; v: number };
  outer: { u: number; v: number };
  outerScale: number;
};

const PIXEL = 1 / 16;

const PARTS: PartSpec[] = [
  { key: "head",     size: [8, 8, 8],   pivot: [0, 10, 0],  base: { u: 0,  v: 0  }, outer: { u: 32, v: 0  }, outerScale: 1.125 },
  { key: "body",     size: [8, 12, 4],  pivot: [0, 0, 0],   base: { u: 16, v: 16 }, outer: { u: 16, v: 32 }, outerScale: 1.125 },
  { key: "rightArm", size: [4, 12, 4],  pivot: [-6, 0, 0],  base: { u: 40, v: 16 }, outer: { u: 40, v: 32 }, outerScale: 1.125 },
  { key: "leftArm",  size: [4, 12, 4],  pivot: [6, 0, 0],   base: { u: 32, v: 48 }, outer: { u: 48, v: 48 }, outerScale: 1.125 },
  { key: "rightLeg", size: [4, 12, 4],  pivot: [-2, -12, 0],base: { u: 0,  v: 16 }, outer: { u: 0,  v: 32 }, outerScale: 1.125 },
  { key: "leftLeg",  size: [4, 12, 4],  pivot: [2, -12, 0], base: { u: 16, v: 48 }, outer: { u: 0,  v: 48 }, outerScale: 1.125 },
];

function buildPart(spec: PartSpec, mat: THREE.Material, outerMat: THREE.Material) {
  const [w, h, d] = spec.size;
  const group = new THREE.Group();

  const baseGeom = new THREE.BoxGeometry(w * PIXEL, h * PIXEL, d * PIXEL);
  const baseRects = setSkinBoxUVs(baseGeom, spec.base.u, spec.base.v, w, h, d);
  const baseMesh = new THREE.Mesh(baseGeom, mat);
  baseMesh.userData.faceRects = baseRects;
  baseMesh.userData.partKey = spec.key;
  group.add(baseMesh);

  const s = spec.outerScale;
  const outerGeom = new THREE.BoxGeometry(w * PIXEL * s, h * PIXEL * s, d * PIXEL * s);
  const outerRects = setSkinBoxUVs(outerGeom, spec.outer.u, spec.outer.v, w, h, d);
  const outerMesh = new THREE.Mesh(outerGeom, outerMat);
  outerMesh.name = "outer";
  outerMesh.userData.faceRects = outerRects;
  outerMesh.userData.partKey = spec.key;
  group.add(outerMesh);

  group.position.set(spec.pivot[0] * PIXEL, spec.pivot[1] * PIXEL, spec.pivot[2] * PIXEL);
  group.name = spec.key;
  return group;
}

export const SkinViewer3D = forwardRef<SkinViewer3DHandle, Props>(function SkinViewer3D(
  { skinUrl, showOuter, visible, showGrid, tool, color, onPickColor, onEdit },
  ref,
) {
  const mountRef = useRef<HTMLDivElement>(null);

  // refs to props for use in event handlers without re-binding
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const onPickRef = useRef(onPickColor);
  const onEditRef = useRef(onEdit);
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { onPickRef.current = onPickColor; }, [onPickColor]);
  useEffect(() => { onEditRef.current = onEdit; }, [onEdit]);

  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    root: THREE.Group;
    parts: Map<BodyPartKey, THREE.Group>;
    canvas: HTMLCanvasElement;          // 64x64 paint buffer
    gridCanvas: HTMLCanvasElement;      // 64x64 grid overlay
    composed: HTMLCanvasElement;        // 64x64 composed (paint + optional grid)
    texture: THREE.CanvasTexture;
    raycaster: THREE.Raycaster;
    pointer2: THREE.Vector2;
    raf: number;
    rotating: boolean;
    pointer: { down: boolean; lx: number; ly: number; mode: "rotate" | "paint" };
    rot: { x: number; y: number };
    distance: number;
    showGrid: boolean;
    cleanup: () => void;
  } | null>(null);

  const partSpecs = useMemo(() => PARTS, []);

  // Imperative handle for export
  useImperativeHandle(ref, () => ({
    exportPng: () => {
      const s = stateRef.current;
      if (!s) return null;
      return s.canvas.toDataURL("image/png");
    },
    getSkinDataUrl: () => {
      const s = stateRef.current;
      if (!s) return null;
      return s.canvas.toDataURL("image/png");
    },
  }));

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const w = mount.clientWidth;
    const h = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;
    const camera = new THREE.PerspectiveCamera(35, w / h, 0.01, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.95));
    const dir = new THREE.DirectionalLight(0xffffff, 0.4);
    dir.position.set(2, 4, 3);
    scene.add(dir);

    const root = new THREE.Group();
    scene.add(root);

    // Paint buffers
    const canvas = document.createElement("canvas");
    canvas.width = 64; canvas.height = 64;
    const gridCanvas = document.createElement("canvas");
    gridCanvas.width = 512; gridCanvas.height = 512;
    const composed = document.createElement("canvas");
    composed.width = 512; composed.height = 512;

    const texture = new THREE.CanvasTexture(composed);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;

    const baseMat = new THREE.MeshStandardMaterial({
      map: texture, transparent: false, roughness: 1, metalness: 0,
    });
    const outerMat = new THREE.MeshStandardMaterial({
      map: texture, transparent: true, alphaTest: 0.01, depthWrite: false,
      side: THREE.DoubleSide, roughness: 1, metalness: 0,
    });

    const parts = new Map<BodyPartKey, THREE.Group>();
    for (const spec of partSpecs) {
      const part = buildPart(spec, baseMat, outerMat);
      parts.set(spec.key, part);
      root.add(part);
    }

    const state = {
      renderer, scene, camera, root, parts,
      canvas, gridCanvas, composed, texture,
      raycaster: new THREE.Raycaster(),
      pointer2: new THREE.Vector2(),
      raf: 0, rotating: false,
      pointer: { down: false, lx: 0, ly: 0, mode: "rotate" as "rotate" | "paint" },
      rot: { x: -0.05, y: 0.4 },
      distance: 3.2,
      showGrid: false,
      cleanup: () => {},
    };

    const compose = () => {
      const ctx = composed.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, 512, 512);
      ctx.drawImage(canvas, 0, 0, 512, 512);
      if (state.showGrid) ctx.drawImage(gridCanvas, 0, 0);
      texture.needsUpdate = true;
    };

    const drawGrid = () => {
      const ctx = gridCanvas.getContext("2d")!;
      ctx.clearRect(0, 0, 512, 512);
      // Upscaled 64x64 atlas → 512x512: one cell = 8px. Draw thin lines on every pixel boundary.
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 64; i++) {
        const p = i * 8 + 0.5;
        ctx.beginPath();
        ctx.moveTo(p, 0); ctx.lineTo(p, 512);
        ctx.moveTo(0, p); ctx.lineTo(512, p);
        ctx.stroke();
      }
    };
    drawGrid();
    compose();

    // Helpers exposed for outer effects via state
    (state as unknown as { _compose: () => void; _redrawGrid: () => void })._compose = compose;
    (state as unknown as { _compose: () => void; _redrawGrid: () => void })._redrawGrid = drawGrid;

    // ---- Pointer / paint handlers ----
    const getMeshIntersection = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      state.pointer2.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      state.pointer2.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      state.raycaster.setFromCamera(state.pointer2, camera);
      const meshes: THREE.Mesh[] = [];
      root.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (m.isMesh && m.visible && m.parent?.visible) meshes.push(m);
      });
      const hits = state.raycaster.intersectObjects(meshes, false);
      return hits[0] ?? null;
    };

    const paintAt = (clientX: number, clientY: number): boolean => {
      const t = toolRef.current;
      if (t === "none") return false;
      const hit = getMeshIntersection(clientX, clientY);
      if (!hit || hit.faceIndex == null || !hit.uv) return false;
      const mesh = hit.object as THREE.Mesh;
      const rects: UvRect[] | undefined = mesh.userData.faceRects;
      if (!rects) return false;
      const faceIndex = Math.floor(hit.faceIndex / 2); // 2 triangles per face
      const r = rects[faceIndex];
      if (!r) return false;
      // hit.uv is in [0,1] over the face's UV rect (texture-space).
      // Convert that UV back into pixel coords inside r.
      // The UVs we set: u in [r.x/64, (r.x+r.w)/64], v in [1-(r.y+r.h)/64, 1-r.y/64]
      const px = Math.floor(hit.uv.x * 64);
      const py = Math.floor((1 - hit.uv.y) * 64);
      if (px < 0 || py < 0 || px >= 64 || py >= 64) return false;

      const ctx = canvas.getContext("2d")!;
      if (t === "pencil") {
        ctx.fillStyle = colorRef.current;
        ctx.clearRect(px, py, 1, 1);
        ctx.fillRect(px, py, 1, 1);
      } else if (t === "eraser") {
        ctx.clearRect(px, py, 1, 1);
      } else if (t === "eyedropper") {
        const data = ctx.getImageData(px, py, 1, 1).data;
        if (data[3] === 0) return false;
        const hex =
          "#" + [data[0], data[1], data[2]]
            .map((n) => n.toString(16).padStart(2, "0"))
            .join("");
        onPickRef.current?.(hex);
        return false;
      }
      compose();
      return true;
    };

    const onDown = (e: PointerEvent) => {
      state.pointer.down = true;
      state.pointer.lx = e.clientX; state.pointer.ly = e.clientY;
      const t = toolRef.current;
      if (t !== "none" && e.button === 0) {
        state.pointer.mode = "paint";
        const painted = paintAt(e.clientX, e.clientY);
        if (painted) onEditRef.current?.(canvas.toDataURL("image/png"));
      } else {
        state.pointer.mode = "rotate";
      }
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!state.pointer.down) return;
      const dx = e.clientX - state.pointer.lx;
      const dy = e.clientY - state.pointer.ly;
      state.pointer.lx = e.clientX; state.pointer.ly = e.clientY;
      if (state.pointer.mode === "paint") {
        paintAt(e.clientX, e.clientY);
      } else {
        state.rot.y -= dx * 0.01;
        state.rot.x -= dy * 0.01;
        state.rot.x = Math.max(-Math.PI/2 + 0.05, Math.min(Math.PI/2 - 0.05, state.rot.x));
      }
    };
    const onUp = (e: PointerEvent) => {
      if (state.pointer.mode === "paint" && toolRef.current !== "none" && toolRef.current !== "eyedropper") {
        onEditRef.current?.(canvas.toDataURL("image/png"));
      }
      state.pointer.down = false;
      state.pointer.mode = "rotate";
      try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {/* */}
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      state.distance *= 1 + e.deltaY * 0.001;
      state.distance = Math.max(1.2, Math.min(10, state.distance));
    };
    renderer.domElement.style.touchAction = "none";
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
      if (state.rotating) state.rot.y += 0.005;
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
      texture.dispose();
      baseMat.dispose();
      outerMat.dispose();
      root.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
    };
    stateRef.current = state;
    return () => state.cleanup();
  }, [partSpecs]);

  // Load skinUrl into the paint canvas
  useEffect(() => {
    const s = stateRef.current;
    if (!s || !skinUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ctx = s.canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, 64, 64);
      const w = img.naturalWidth, h = img.naturalHeight;
      if (w === 64 && (h === 64 || h === 32)) ctx.drawImage(img, 0, 0);
      else ctx.drawImage(img, 0, 0, 64, 64);
      const inner = s as unknown as { _compose: () => void };
      inner._compose();
    };
    img.src = skinUrl;
  }, [skinUrl]);

  // Visibility / outer / grid toggles
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    for (const [key, group] of s.parts) {
      group.visible = visible[key];
      const outer = group.getObjectByName("outer");
      if (outer) outer.visible = showOuter;
    }
  }, [visible, showOuter]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    s.showGrid = showGrid;
    const inner = s as unknown as { _compose: () => void };
    inner._compose();
  }, [showGrid]);

  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} className="h-full w-full" />
      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <button
          onClick={() => {
            const s = stateRef.current;
            if (s) s.rotating = !s.rotating;
          }}
          className="rounded-md border border-border bg-card/80 px-2.5 py-1 text-xs font-medium backdrop-blur hover:bg-accent"
        >
          Auto-rotate
        </button>
      </div>
      <div className="absolute bottom-3 left-3 rounded-md bg-card/80 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur border border-border">
        Drag to rotate · Scroll to zoom · Click with a brush to paint
      </div>
    </div>
  );
});