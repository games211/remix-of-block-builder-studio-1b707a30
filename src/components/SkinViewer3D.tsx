import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export type BodyPartKey =
  | "head"
  | "body"
  | "rightArm"
  | "leftArm"
  | "rightLeg"
  | "leftLeg";

export type Visibility = Record<BodyPartKey, boolean>;

interface Props {
  skinUrl: string | null;
  showOuter: boolean;
  visible: Visibility;
}

/**
 * Sets BoxGeometry UVs from a Minecraft skin atlas.
 * Atlas size = 64x64. Origin (u,v) = top-left of the 4-block UV strip on the texture.
 * (w,h,d) are the box dimensions in texture pixels.
 */
function setSkinBoxUVs(
  geom: THREE.BoxGeometry,
  u: number,
  v: number,
  w: number,
  h: number,
  d: number,
  atlasW = 64,
  atlasH = 64,
) {
  const uvAttr = geom.attributes.uv as THREE.BufferAttribute;

  const rect = (x: number, y: number, rw: number, rh: number) => {
    const u0 = x / atlasW;
    const u1 = (x + rw) / atlasW;
    const v0 = 1 - (y + rh) / atlasH;
    const v1 = 1 - y / atlasH;
    // Three BoxGeometry UV order per face: TL, TR, BL, BR
    return [u0, v1, u1, v1, u0, v0, u1, v0];
  };

  // Face order in BoxGeometry: +X, -X, +Y, -Y, +Z, -Z
  // MC convention: model faces +Z (front).
  // model right side = -X => uses MC "right" UV at (u, v+d)
  // model left  side = +X => uses MC "left"  UV at (u+d+w, v+d)
  const faces = [
    rect(u + d + w, v + d, d, h), // +X = model left
    rect(u, v + d, d, h),         // -X = model right
    rect(u + d, v, w, d),         // +Y top
    rect(u + d + w, v, w, d),     // -Y bottom
    rect(u + d, v + d, w, h),     // +Z front
    rect(u + 2 * d + w, v + d, w, h), // -Z back
  ];

  let vi = 0;
  for (const face of faces) {
    for (let k = 0; k < 4; k++) {
      uvAttr.setXY(vi++, face[k * 2], face[k * 2 + 1]);
    }
  }
  uvAttr.needsUpdate = true;
}

type PartSpec = {
  key: BodyPartKey;
  size: [number, number, number]; // w,h,d in skin pixels
  pivot: [number, number, number]; // model position of cube center (in pixels)
  base: { u: number; v: number };
  outer: { u: number; v: number };
  outerScale: number; // typically 1.125, head 1.125 too
};

const PIXEL = 1 / 16; // 1 skin pixel = 1/16 model unit

const PARTS: PartSpec[] = [
  {
    key: "head",
    size: [8, 8, 8],
    pivot: [0, 10, 0], // head center 10 above body center
    base: { u: 0, v: 0 },
    outer: { u: 32, v: 0 },
    outerScale: 1.125,
  },
  {
    key: "body",
    size: [8, 12, 4],
    pivot: [0, 0, 0],
    base: { u: 16, v: 16 },
    outer: { u: 16, v: 32 },
    outerScale: 1.125,
  },
  {
    key: "rightArm",
    size: [4, 12, 4],
    pivot: [-6, 0, 0],
    base: { u: 40, v: 16 },
    outer: { u: 40, v: 32 },
    outerScale: 1.125,
  },
  {
    key: "leftArm",
    size: [4, 12, 4],
    pivot: [6, 0, 0],
    base: { u: 32, v: 48 },
    outer: { u: 48, v: 48 },
    outerScale: 1.125,
  },
  {
    key: "rightLeg",
    size: [4, 12, 4],
    pivot: [-2, -12, 0],
    base: { u: 0, v: 16 },
    outer: { u: 0, v: 32 },
    outerScale: 1.125,
  },
  {
    key: "leftLeg",
    size: [4, 12, 4],
    pivot: [2, -12, 0],
    base: { u: 16, v: 48 },
    outer: { u: 0, v: 48 },
    outerScale: 1.125,
  },
];

function buildPart(spec: PartSpec, texture: THREE.Texture) {
  const [w, h, d] = spec.size;
  const group = new THREE.Group();

  const baseGeom = new THREE.BoxGeometry(w * PIXEL, h * PIXEL, d * PIXEL);
  setSkinBoxUVs(baseGeom, spec.base.u, spec.base.v, w, h, d);
  const baseMat = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: false,
    roughness: 1,
    metalness: 0,
  });
  const baseMesh = new THREE.Mesh(baseGeom, baseMat);
  group.add(baseMesh);

  const s = spec.outerScale;
  const outerGeom = new THREE.BoxGeometry(
    w * PIXEL * s,
    h * PIXEL * s,
    d * PIXEL * s,
  );
  setSkinBoxUVs(outerGeom, spec.outer.u, spec.outer.v, w, h, d);
  const outerMat = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.01,
    depthWrite: false,
    side: THREE.DoubleSide,
    roughness: 1,
    metalness: 0,
  });
  const outerMesh = new THREE.Mesh(outerGeom, outerMat);
  outerMesh.name = "outer";
  group.add(outerMesh);

  group.position.set(
    spec.pivot[0] * PIXEL,
    spec.pivot[1] * PIXEL,
    spec.pivot[2] * PIXEL,
  );
  group.name = spec.key;
  return group;
}

export function SkinViewer3D({ skinUrl, showOuter, visible }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    root: THREE.Group;
    parts: Map<BodyPartKey, THREE.Group>;
    texture: THREE.Texture | null;
    raf: number;
    rotating: boolean;
    pointer: { down: boolean; lx: number; ly: number };
    rot: { x: number; y: number };
    distance: number;
    cleanup: () => void;
  } | null>(null);

  const partSpecs = useMemo(() => PARTS, []);

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

    const state = {
      renderer, scene, camera, root,
      parts: new Map<BodyPartKey, THREE.Group>(),
      texture: null as THREE.Texture | null,
      raf: 0, rotating: false,
      pointer: { down: false, lx: 0, ly: 0 },
      rot: { x: -0.05, y: 0.4 },
      distance: 3.2,
      cleanup: () => {},
    };

    const onDown = (e: PointerEvent) => {
      state.pointer.down = true;
      state.pointer.lx = e.clientX; state.pointer.ly = e.clientY;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!state.pointer.down) return;
      const dx = e.clientX - state.pointer.lx;
      const dy = e.clientY - state.pointer.ly;
      state.pointer.lx = e.clientX; state.pointer.ly = e.clientY;
      state.rot.y -= dx * 0.01;
      state.rot.x -= dy * 0.01;
      state.rot.x = Math.max(-Math.PI/2 + 0.05, Math.min(Math.PI/2 - 0.05, state.rot.x));
    };
    const onUp = (e: PointerEvent) => {
      state.pointer.down = false;
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
    };
    stateRef.current = state;
    return () => state.cleanup();
  }, []);

  // Build / rebuild model when texture changes
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    // Clear existing
    while (s.root.children.length) {
      const c = s.root.children.pop()!;
      c.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const m = mesh.material;
        if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
        else if (m) (m as THREE.Material).dispose();
      });
    }
    if (s.texture) {
      s.texture.dispose();
      s.texture = null;
    }
    s.parts.clear();
    if (!skinUrl) return;

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(skinUrl, (tex) => {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = false;
      s.texture = tex;
      for (const spec of partSpecs) {
        const part = buildPart(spec, tex);
        s.parts.set(spec.key, part);
        s.root.add(part);
      }
      // Apply current toggles immediately
      applyToggles(s.parts, visible, showOuter);
    });
  }, [skinUrl, partSpecs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply visibility toggles
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    applyToggles(s.parts, visible, showOuter);
  }, [visible, showOuter]);

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
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}

function applyToggles(
  parts: Map<BodyPartKey, THREE.Group>,
  visible: Visibility,
  showOuter: boolean,
) {
  for (const [key, group] of parts) {
    group.visible = visible[key];
    const outer = group.getObjectByName("outer");
    if (outer) outer.visible = showOuter;
  }
}