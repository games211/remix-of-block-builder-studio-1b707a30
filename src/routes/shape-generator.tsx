import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import {
  Boxes,
  Circle,
  Cylinder,
  Download,
  Globe,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Egg,
  Eye,
  ZoomIn,
  ZoomOut,
  Menu,
  Home as HomeIcon,
  Image as ImageIcon,
  Palette,
  Shirt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { generateShape, countBlocks, type ShapeType } from "@/lib/shapes";
import { LayerCanvas, exportLayerPNG } from "@/components/LayerCanvas";
import { Voxel3D } from "@/components/Voxel3D";
import { downloadSchem } from "@/lib/schematic";

export const Route = createFileRoute("/shape-generator")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Minecraft Tools — Shape Generator" },
      {
        name: "description",
        content:
          "A growing collection of Minecraft tools. Generate block layouts for spheres, ellipsoids, circles, cylinders and domes with layer-by-layer build guides.",
      },
    ],
  }),
});

const SHAPES: { id: ShapeType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "sphere", label: "Sphere", icon: Globe },
  { id: "ellipsoid", label: "Ellipsoid", icon: Egg },
  { id: "circle", label: "Circle", icon: Circle },
  { id: "cylinder", label: "Cylinder", icon: Cylinder },
  { id: "dome", label: "Dome", icon: Boxes },
];

function NumberSlider({
  label,
  value,
  onChange,
  min = 1,
  max = 64,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
          className="h-7 w-20 text-right tabular-nums"
        />
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={1}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
}

function Home() {
  const { theme, toggle: toggleTheme } = useTheme();
  const [shape, setShape] = useState<ShapeType>("sphere");
  const [rx, setRx] = useState(12);
  const [ry, setRy] = useState(12);
  const [rz, setRz] = useState(12);
  const [hollow, setHollow] = useState(true);
  const [thickness, setThickness] = useState(1);
  const [layerIdx, setLayerIdx] = useState(0);
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [isolateLayer, setIsolateLayer] = useState(false);
  const [zoom, setZoom] = useState(1);

  const voxels = useMemo(() => {
    return generateShape({ type: shape, rx, ry, rz, hollow, thickness });
  }, [shape, rx, ry, rz, hollow, thickness]);

  const totalLayers = voxels.length;
  const safeIdx = Math.min(layerIdx, totalLayers - 1);
  const currentLayer = voxels[safeIdx];
  const blockCount = useMemo(() => countBlocks(voxels), [voxels]);

  useEffect(() => {
    setLayerIdx(Math.floor(totalLayers / 2));
  }, [shape, rx, ry, rz, hollow, thickness, totalLayers]);

  const showRy = shape === "ellipsoid" || shape === "cylinder" || shape === "dome";
  const showRz = shape === "ellipsoid" || shape === "cylinder" || shape === "dome";

  const downloadPng = () => {
    exportLayerPNG(currentLayer, `${shape}-layer-${safeIdx + 1}.png`);
  };
  const downloadSchematic = () => {
    downloadSchem(voxels, `${shape}.schem`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-right" />

      {/* Top app bar */}
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
                <Link
                  to="/"
                  className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-left text-sm font-medium hover:bg-accent/40"
                >
                  <HomeIcon className="h-4 w-4" />
                  Home
                </Link>
                <Link
                  to="/shape-generator"
                  className="flex items-center gap-3 rounded-md border border-primary/40 bg-accent/40 px-3 py-2 text-left text-sm font-medium"
                >
                  <Boxes className="h-4 w-4" />
                  Shape Generator
                </Link>
                <Link
                  to="/pixel-art"
                  className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-left text-sm font-medium hover:bg-accent/40"
                >
                  <ImageIcon className="h-4 w-4" />
                  Image to Pixel Art
                </Link>
                <Link
                  to="/gradient"
                  className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-left text-sm font-medium hover:bg-accent/40"
                >
                  <Palette className="h-4 w-4" />
                  Block Gradient
                </Link>
                <Link
                  to="/skin-editor"
                  className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-left text-sm font-medium hover:bg-accent/40"
                >
                  <Shirt className="h-4 w-4" />
                  Skin Editor
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <Boxes className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold tracking-tight">Minecraft Tools</h1>
            <p className="text-xs text-muted-foreground -mt-0.5 truncate">
              Shape generator
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-4 sm:gap-6 px-3 sm:px-4 py-4 sm:py-6 lg:grid-cols-[320px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-4">
          <Card className="p-4 space-y-4" style={{ backgroundImage: "var(--gradient-surface)" }}>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Shape
              </Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {SHAPES.map((s) => {
                  const Icon = s.icon;
                  const active = shape === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setShape(s.id)}
                      className={`group flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs font-medium transition-all ${
                        active
                          ? "border-primary text-primary-foreground shadow-[var(--shadow-elegant)]"
                          : "border-border bg-card hover:border-primary/40 hover:bg-accent/40"
                      }`}
                      style={active ? { backgroundImage: "var(--gradient-primary)" } : undefined}
                    >
                      <Icon className="h-5 w-5" />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-5">
            <NumberSlider
              label={shape === "circle" ? "Radius" : shape === "cylinder" ? "Radius X" : "Radius X"}
              value={rx}
              onChange={setRx}
              min={1}
              max={80}
            />
            {showRy && (
              <NumberSlider
                label={shape === "cylinder" ? "Height" : "Radius Y"}
                value={ry}
                onChange={setRy}
                min={1}
                max={80}
              />
            )}
            {showRz && (
              <NumberSlider label="Radius Z" value={rz} onChange={setRz} min={1} max={80} />
            )}

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
              <div>
                <Label className="text-sm font-medium">Hollow</Label>
                <p className="text-xs text-muted-foreground">Shell only</p>
              </div>
              <Switch checked={hollow} onCheckedChange={setHollow} />
            </div>

            {hollow && (
              <NumberSlider
                label="Wall thickness"
                value={thickness}
                onChange={setThickness}
                min={1}
                max={6}
              />
            )}
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Blocks
              </span>
              <span className="text-lg font-semibold tabular-nums">
                {blockCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Layers
              </span>
              <span className="text-lg font-semibold tabular-nums">{totalLayers}</span>
            </div>
          </Card>
        </aside>

        {/* Main canvas */}
        <main className="space-y-4">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/30 px-4 py-3">
              <Tabs value={view} onValueChange={(v) => setView(v as "2d" | "3d")}>
                <TabsList>
                  <TabsTrigger value="2d">2D</TabsTrigger>
                  <TabsTrigger value="3d">3D</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setLayerIdx((i) => Math.max(0, i - 1))}
                  disabled={safeIdx === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-28 text-center text-sm font-medium tabular-nums">
                  Layer {safeIdx + 1} / {totalLayers}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setLayerIdx((i) => Math.min(totalLayers - 1, i + 1))}
                  disabled={safeIdx === totalLayers - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={safeIdx + 1}
                  min={1}
                  max={Math.max(1, totalLayers)}
                  onChange={(e) =>
                    setLayerIdx(
                      Math.max(0, Math.min(totalLayers - 1, (Number(e.target.value) || 1) - 1)),
                    )
                  }
                  className="h-7 w-16 text-right tabular-nums"
                />
              </div>
              <div className="flex-1 min-w-40">
                <Slider
                  value={[safeIdx]}
                  min={0}
                  max={Math.max(0, totalLayers - 1)}
                  step={1}
                  onValueChange={(v) => setLayerIdx(v[0])}
                />
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                {view === "2d" && (
                  <div className="flex items-center gap-1 rounded-md border border-border bg-card/60 p-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)))}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <button
                      onClick={() => setZoom(1)}
                      className="min-w-12 px-1 text-xs font-medium tabular-nums hover:underline"
                    >
                      {Math.round(zoom * 100)}%
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setZoom((z) => Math.min(8, +(z + 0.25).toFixed(2)))}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {view === "3d" && (
                  <Button
                    variant={isolateLayer ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsolateLayer((v) => !v)}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">Only this layer</span>
                  </Button>
                )}
                <Button size="sm" onClick={downloadSchematic} className="shadow-[var(--shadow-elegant)]">
                  <Download className="h-4 w-4" />
                  .schem
                </Button>
              </div>
            </div>

            <div
              className="relative flex items-center justify-center overflow-auto p-3 sm:p-6 min-h-[360px] h-[calc(100svh-13rem)] sm:h-[calc(100svh-12rem)] lg:h-[calc(100svh-10rem)]"
              style={{ backgroundImage: "var(--gradient-surface)" }}
              onWheel={(e) => {
                if (view !== "2d") return;
                if (!(e.ctrlKey || e.metaKey)) return;
                e.preventDefault();
                setZoom((z) => {
                  const next = z * (1 - e.deltaY * 0.0015);
                  return Math.max(0.25, Math.min(8, +next.toFixed(2)));
                });
              }}
            >
              {view === "2d" ? (
                <LayerCanvas layer={currentLayer} zoom={zoom} />
              ) : (
                <Voxel3D voxels={voxels} highlightLayer={safeIdx} isolateLayer={isolateLayer} />
              )}
            </div>
          </Card>

        </main>
      </div>
    </div>
  );
}
