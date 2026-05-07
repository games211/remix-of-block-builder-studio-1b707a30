import { useEffect, useRef } from "react";

function readColor(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function paintLayer(
  ctx: CanvasRenderingContext2D,
  layer: boolean[][],
  cs: number,
  showGrid: boolean,
) {
  const h = layer.length;
  const w = layer[0].length;
  const filled = readColor("--grid-filled", "oklch(0.58 0.19 265)");
  const empty = readColor("--grid-empty", "oklch(0.96 0.01 250)");
  const line = readColor("--grid-line", "oklch(0.88 0.01 255)");

  ctx.fillStyle = empty;
  ctx.fillRect(0, 0, w * cs, h * cs);

  ctx.fillStyle = filled;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (layer[y][x]) ctx.fillRect(x * cs, y * cs, cs, cs);
    }
  }

  if (showGrid && cs >= 6) {
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= w; x++) {
      ctx.moveTo(x * cs + 0.5, 0);
      ctx.lineTo(x * cs + 0.5, h * cs);
    }
    for (let y = 0; y <= h; y++) {
      ctx.moveTo(0, y * cs + 0.5);
      ctx.lineTo(w * cs, y * cs + 0.5);
    }
    ctx.stroke();
  }
}

interface Props {
  layer: boolean[][];
  cellSize?: number;
  showGrid?: boolean;
  zoom?: number;
}

export function LayerCanvas({ layer, cellSize, showGrid = true, zoom = 1 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !layer.length) return;
    const h = layer.length;
    const w = layer[0].length;
    const maxPx = 640;
    const baseCs = cellSize ?? Math.max(2, Math.floor(maxPx / Math.max(w, h)));
    const cs = Math.max(1, Math.round(baseCs * zoom));
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * cs * dpr;
    canvas.height = h * cs * dpr;
    canvas.style.width = `${w * cs}px`;
    canvas.style.height = `${h * cs}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintLayer(ctx, layer, cs, showGrid);
  }, [layer, cellSize, showGrid, zoom]);

  return (
    <canvas
      ref={ref}
      className="rounded-lg shadow-[var(--shadow-soft)] border border-border max-w-full"
    />
  );
}

export function exportLayerPNG(layer: boolean[][], filename: string) {
  const h = layer.length;
  const w = layer[0].length;
  const cs = Math.max(8, Math.floor(1200 / Math.max(w, h)));
  const canvas = document.createElement("canvas");
  canvas.width = w * cs;
  canvas.height = h * cs;
  const ctx = canvas.getContext("2d")!;
  paintLayer(ctx, layer, cs, true);
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}
