import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import {
  Boxes,
  Image as ImageIcon,
  Menu,
  Moon,
  Sun,
  Home as HomeIcon,
  Palette,
  Shirt,
  Upload,
  Download,
  Pencil,
  Eraser,
  Pipette,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/skin-editor")({
  component: SkinEditor,
  head: () => ({
    meta: [
      { title: "Minecraft Tools — Skin Editor" },
      {
        name: "description",
        content:
          "Edit Minecraft skins in your browser. Import a skin from a PNG file or grab any player's skin by Minecraft username.",
      },
    ],
  }),
});

const SKIN_W = 64;
const SKIN_H = 64;

type Tool = "pencil" | "eraser" | "eyedropper";

function SkinEditor() {
  const { theme, toggle: toggleTheme } = useTheme();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState("#7a4a2b");
  const [zoom, setZoom] = useState(10);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setTick] = useState(0);

  // Initialise blank canvas
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = SKIN_W;
    c.height = SKIN_H;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, SKIN_W, SKIN_H);
    drawOverlay();
  }, []);

  const drawOverlay = () => {
    const o = overlayRef.current;
    if (!o) return;
    o.width = SKIN_W;
    o.height = SKIN_H;
    const ctx = o.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, SKIN_W, SKIN_H);
    // Highlight skin layout regions (head, body, arms, legs - front faces only)
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 0.05;
    const rects: [number, number, number, number][] = [
      // Head
      [0, 0, 32, 16], [32, 0, 32, 16],
      // Body / arms / legs (top of skin)
      [0, 16, 64, 16], [16, 16, 24, 16],
      // Bottom half (1.8+)
      [0, 32, 64, 16], [16, 48, 32, 16], [32, 48, 16, 16],
    ];
    for (const [x, y, w, h] of rects) {
      ctx.strokeRect(x + 0.025, y + 0.025, w - 0.05, h - 0.05);
    }
  };

  const getCtx = () => canvasRef.current?.getContext("2d") ?? null;

  const drawImageToCanvas = (img: HTMLImageElement) => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, SKIN_W, SKIN_H);
    // Handle 64x32 (legacy) by drawing at top
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (w === 64 && (h === 64 || h === 32)) {
      ctx.drawImage(img, 0, 0);
    } else {
      // Try to fit
      ctx.drawImage(img, 0, 0, SKIN_W, SKIN_H);
    }
    setTick((t) => t + 1);
  };

  const onFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      drawImageToCanvas(img);
      URL.revokeObjectURL(url);
      toast.success("Skin imported");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast.error("Could not read image");
    };
    img.src = url;
  };

  const fetchByUsername = async () => {
    const name = username.trim();
    if (!name) {
      toast.error("Enter a Minecraft username");
      return;
    }
    setLoading(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        drawImageToCanvas(img);
        toast.success(`Loaded skin for ${name}`);
        setLoading(false);
      };
      img.onerror = () => {
        toast.error("Could not fetch skin (check username)");
        setLoading(false);
      };
      // minotar.net serves CORS-friendly raw skin PNGs
      img.src = `https://minotar.net/skin/${encodeURIComponent(name)}?_=${Date.now()}`;
    } catch {
      toast.error("Failed to fetch skin");
      setLoading(false);
    }
  };

  const downloadPng = () => {
    const c = canvasRef.current;
    if (!c) return;
    c.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skin-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const clearAll = () => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.clearRect(0, 0, SKIN_W, SKIN_H);
    setTick((t) => t + 1);
  };

  // Painting handlers
  const drawingRef = useRef(false);

  const pixelFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    const wrap = e.currentTarget.getBoundingClientRect();
    const px = Math.floor(((e.clientX - wrap.left) / wrap.width) * SKIN_W);
    const py = Math.floor(((e.clientY - wrap.top) / wrap.height) * SKIN_H);
    if (px < 0 || py < 0 || px >= SKIN_W || py >= SKIN_H) return null;
    return { x: px, y: py };
  };

  const applyAt = (x: number, y: number) => {
    const ctx = getCtx();
    if (!ctx) return;
    if (tool === "pencil") {
      ctx.fillStyle = color;
      ctx.clearRect(x, y, 1, 1);
      ctx.fillRect(x, y, 1, 1);
    } else if (tool === "eraser") {
      ctx.clearRect(x, y, 1, 1);
    } else if (tool === "eyedropper") {
      const data = ctx.getImageData(x, y, 1, 1).data;
      if (data[3] === 0) return;
      const hex =
        "#" +
        [data[0], data[1], data[2]]
          .map((n) => n.toString(16).padStart(2, "0"))
          .join("");
      setColor(hex);
      setTool("pencil");
    }
    setTick((t) => t + 1);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const p = pixelFromEvent(e);
    if (p) applyAt(p.x, p.y);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawingRef.current) return;
    const p = pixelFromEvent(e);
    if (p) applyAt(p.x, p.y);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    drawingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const canvasSize = SKIN_W * zoom;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-2 sm:gap-3 px-3 sm:px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>Minecraft Tools</SheetTitle>
                <SheetDescription>Pick a tool to use</SheetDescription>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                <Link to="/" className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent/40">
                  <HomeIcon className="h-4 w-4" /> Home
                </Link>
                <Link to="/shape-generator" className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent/40">
                  <Boxes className="h-4 w-4" /> Shape Generator
                </Link>
                <Link to="/pixel-art" className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent/40">
                  <ImageIcon className="h-4 w-4" /> Image to Pixel Art
                </Link>
                <Link to="/gradient" className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent/40">
                  <Palette className="h-4 w-4" /> Block Gradient
                </Link>
                <Link to="/skin-editor" className="flex items-center gap-3 rounded-md border border-primary/40 bg-accent/40 px-3 py-2 text-sm font-medium">
                  <Shirt className="h-4 w-4" /> Skin Editor
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <Shirt className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold tracking-tight">Minecraft Tools</h1>
            <p className="text-xs text-muted-foreground -mt-0.5 truncate">Skin Editor</p>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-4 sm:gap-6 px-3 sm:px-4 py-4 sm:py-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <Card className="p-4 space-y-3" style={{ backgroundImage: "var(--gradient-surface)" }}>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Import skin
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = "";
              }}
            />
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Upload PNG
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Supports 64×64 (modern) and 64×32 (legacy) skins.
            </p>
          </Card>

          <Card className="p-4 space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Grab by username
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Notch"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchByUsername();
                }}
                maxLength={32}
              />
              <Button onClick={fetchByUsername} disabled={loading} size="icon" aria-label="Fetch">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Fetches the player's current Java Edition skin.
            </p>
          </Card>

          <Card className="p-4 space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Tools
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "pencil", label: "Pencil", icon: Pencil },
                { id: "eraser", label: "Eraser", icon: Eraser },
                { id: "eyedropper", label: "Pick", icon: Pipette },
              ] as const).map((t) => {
                const Icon = t.icon;
                const on = tool === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTool(t.id)}
                    className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-[11px] font-medium transition-colors ${
                      on
                        ? "border-primary bg-accent/40"
                        : "border-border hover:bg-accent/40"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Label className="text-sm font-medium">Color</Label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 flex-1 font-mono text-xs"
              />
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Zoom</Label>
                <span className="text-xs tabular-nums text-muted-foreground">{zoom}×</span>
              </div>
              <input
                type="range"
                min={4}
                max={20}
                step={1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <Button onClick={downloadPng} className="w-full gap-2">
              <Download className="h-4 w-4" /> Download PNG
            </Button>
            <Button onClick={clearAll} variant="outline" className="w-full">
              Clear canvas
            </Button>
          </Card>
        </aside>

        <main>
          <Card className="p-4" style={{ backgroundImage: "var(--gradient-surface)" }}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Editor</h2>
                <p className="text-xs text-muted-foreground">
                  Click and drag to paint. The grid shows skin layout regions.
                </p>
              </div>
              <span className="rounded-md border border-border bg-card/60 px-2 py-1 text-[11px] text-muted-foreground">
                64 × 64
              </span>
            </div>
            <div className="flex justify-center overflow-auto rounded-md border border-border bg-[conic-gradient(at_top_left,#0001_25%,transparent_0,transparent_50%,#0001_0,#0001_75%,transparent_0)] [background-size:16px_16px] p-4">
              <div
                className="relative cursor-crosshair touch-none select-none"
                style={{ width: canvasSize, height: canvasSize }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 h-full w-full [image-rendering:pixelated]"
                />
                <canvas
                  ref={overlayRef}
                  className="pointer-events-none absolute inset-0 h-full w-full [image-rendering:pixelated] opacity-50"
                />
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}