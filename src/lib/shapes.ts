// Voxel-based shape generation for Minecraft block layouts.
// Each generator returns a 3D boolean array [layer][y][x] where true = block present.
// For 2D circle, returns single-layer.

export type ShapeType = "sphere" | "ellipsoid" | "circle" | "cylinder" | "dome";

export interface ShapeParams {
  type: ShapeType;
  rx: number; // radius X
  ry: number; // radius Y (height for cylinder/dome)
  rz: number; // radius Z
  hollow: boolean;
  thickness: number; // wall thickness for hollow
}

export type Voxels = boolean[][][]; // [z][y][x] - z is layer index

function makeGrid(d: number, h: number, w: number): Voxels {
  const out: Voxels = new Array(d);
  for (let i = 0; i < d; i++) {
    out[i] = new Array(h);
    for (let j = 0; j < h; j++) out[i][j] = new Array(w).fill(false);
  }
  return out;
}

// Ellipsoid test: point is inside if (x/a)^2 + (y/b)^2 + (z/c)^2 <= 1
// We use radius+0.5 offset to match Minecraft-style block placement (Plotz-like).
function ellipsoidSolid(rx: number, ry: number, rz: number): Voxels {
  const w = rx * 2 + 1;
  const h = ry * 2 + 1;
  const d = rz * 2 + 1;
  const grid = makeGrid(d, h, w);
  const a = rx + 0.5;
  const b = ry + 0.5;
  const c = rz + 0.5;
  for (let z = 0; z < d; z++) {
    const dz = (z - rz) / c;
    const dz2 = dz * dz;
    for (let y = 0; y < h; y++) {
      const dy = (y - ry) / b;
      const dy2 = dy * dy;
      for (let x = 0; x < w; x++) {
        const dx = (x - rx) / a;
        if (dx * dx + dy2 + dz2 <= 1) grid[z][y][x] = true;
      }
    }
  }
  return grid;
}

function hollowFromSolid(solid: Voxels, thickness: number): Voxels {
  const d = solid.length;
  const h = solid[0].length;
  const w = solid[0][0].length;
  const out = makeGrid(d, h, w);
  // A voxel is shell if it is filled AND any neighbor within `thickness` is empty.
  // Efficient approach: erode solid by `thickness` and subtract.
  // We'll mark all filled voxels that have an empty voxel within `thickness` (Chebyshev distance).
  const t = Math.max(1, Math.floor(thickness));
  for (let z = 0; z < d; z++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!solid[z][y][x]) continue;
        let isShell = false;
        outer: for (let dz = -t; dz <= t; dz++) {
          const nz = z + dz;
          if (nz < 0 || nz >= d) {
            isShell = true;
            break outer;
          }
          for (let dy = -t; dy <= t; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= h) {
              isShell = true;
              break outer;
            }
            for (let dx = -t; dx <= t; dx++) {
              const nx = x + dx;
              if (nx < 0 || nx >= w) {
                isShell = true;
                break outer;
              }
              if (!solid[nz][ny][nx]) {
                isShell = true;
                break outer;
              }
            }
          }
        }
        if (isShell) out[z][y][x] = true;
      }
    }
  }
  return out;
}

// 2D circle (single layer)
function circle2D(r: number, hollow: boolean, thickness: number): Voxels {
  const w = r * 2 + 1;
  const grid = makeGrid(1, w, w);
  const a = r + 0.5;
  const inner = Math.max(0, r + 0.5 - thickness);
  for (let y = 0; y < w; y++) {
    const dy = (y - r) / a;
    const dy2 = dy * dy;
    for (let x = 0; x < w; x++) {
      const dx = (x - r) / a;
      const d2 = dx * dx + dy2;
      if (d2 <= 1) {
        if (!hollow) {
          grid[0][y][x] = true;
        } else {
          // shell: distance from center between inner and outer
          const dist2 = (x - r) * (x - r) + (y - r) * (y - r);
          if (dist2 >= inner * inner) grid[0][y][x] = true;
        }
      }
    }
  }
  return grid;
}

// Cylinder: stack of identical 2D circles with given height (ry layers)
function cylinder(rx: number, height: number, rz: number, hollow: boolean, thickness: number): Voxels {
  // Use ellipse cross-section (rx, rz). Height = number of layers.
  const w = rx * 2 + 1;
  const dd = rz * 2 + 1;
  const h = Math.max(1, height);
  const grid = makeGrid(h, dd, w);
  const a = rx + 0.5;
  const c = rz + 0.5;
  // Build 2D ellipse mask
  const mask: boolean[][] = [];
  for (let z = 0; z < dd; z++) {
    mask[z] = new Array(w).fill(false);
    const dz = (z - rz) / c;
    const dz2 = dz * dz;
    for (let x = 0; x < w; x++) {
      const dx = (x - rx) / a;
      if (dx * dx + dz2 <= 1) mask[z][x] = true;
    }
  }
  // Hollow ring mask (2D shell)
  let useMask = mask;
  if (hollow) {
    const ring: boolean[][] = mask.map((row) => row.slice());
    const t = Math.max(1, Math.floor(thickness));
    for (let z = 0; z < dd; z++) {
      for (let x = 0; x < w; x++) {
        if (!mask[z][x]) {
          ring[z][x] = false;
          continue;
        }
        let shell = false;
        outer: for (let dz = -t; dz <= t; dz++) {
          for (let dx = -t; dx <= t; dx++) {
            const nz = z + dz, nx = x + dx;
            if (nz < 0 || nz >= dd || nx < 0 || nx >= w || !mask[nz][nx]) {
              shell = true;
              break outer;
            }
          }
        }
        ring[z][x] = shell;
      }
    }
    useMask = ring;
  }
  for (let layer = 0; layer < h; layer++) {
    const isCap = hollow && (layer === 0 || layer === h - 1);
    for (let z = 0; z < dd; z++) {
      for (let x = 0; x < w; x++) {
        if (isCap ? mask[z][x] : useMask[z][x]) grid[layer][z][x] = true;
      }
    }
  }
  return grid;
}

export function generateShape(p: ShapeParams): Voxels {
  const rx = Math.max(0, Math.floor(p.rx));
  const ry = Math.max(0, Math.floor(p.ry));
  const rz = Math.max(0, Math.floor(p.rz));
  const t = Math.max(1, Math.floor(p.thickness));

  switch (p.type) {
    case "circle":
      return circle2D(rx, p.hollow, t);
    case "cylinder":
      return cylinder(rx, ry, rz, p.hollow, t);
    case "sphere": {
      const solid = ellipsoidSolid(rx, rx, rx);
      return p.hollow ? hollowFromSolid(solid, t) : solid;
    }
    case "ellipsoid": {
      const solid = ellipsoidSolid(rx, ry, rz);
      return p.hollow ? hollowFromSolid(solid, t) : solid;
    }
    case "dome": {
      // Hemisphere with flat base at the bottom: keep upper half of the sphere
      // (layers from the equator upward), so layer 0 is the flat circular base.
      const full = ellipsoidSolid(rx, ry, rz);
      const out: Voxels = full.slice(rz, rz * 2 + 1).map((layer) => layer.map((row) => row.slice()));
      return p.hollow ? hollowFromSolid(out, t) : out;
    }
  }
}

export function countBlocks(v: Voxels): number {
  let n = 0;
  for (const layer of v) for (const row of layer) for (const cell of row) if (cell) n++;
  return n;
}

export function layerToText(layer: boolean[][]): string {
  return layer.map((row) => row.map((c) => (c ? "█" : "·")).join("")).join("\n");
}

export function allLayersToText(v: Voxels): string {
  return v
    .map((layer, i) => `Layer ${i + 1}/${v.length}\n${layerToText(layer)}`)
    .join("\n\n");
}
