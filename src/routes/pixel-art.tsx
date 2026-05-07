import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import {
  Boxes,
  Image as ImageIcon,
  Menu,
  Moon,
  Sun,
  Home as HomeIcon,
  Upload,
  Palette,
  Shirt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BLOCKS,
  VERSION_ENTRIES,
  parseVersionId,
  hexToRgb,
  isAvailableIn,
  nearestBlock,
  blockSwatchStyle,
  type BlockDef,
} from "@/lib/blocks";
import { PixelArt3D, type PixelGrid } from "@/components/PixelArt3D";

export const Route = createFileRoute("/pixel-art")({
  component: PixelArtTool,
  head: () => ({
    meta: [
      { title: "Minecraft Tools — Image to Pixel Art" },
      {
        name: "description",
        content:
          "Convert any image into Minecraft block pixel art. Pick your version, toggle individual blocks, and preview the build in 3D.",
      },
    ],
  }),
});

function PixelArtTool() {
  const { theme, toggle: toggleTheme } = useTheme();

  const [versionId, setVersionId] = useState<string>("java:1.21.11");
  const version = parseVersionId(versionId).version;
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {};
    for (const b of BLOCKS) o[b.id] = isAvailableIn(b, "1.21.11");
    return o;
  });

  // When version changes: enable available blocks, disable unavailable ones.
  const onVersionChange = (id: string) => {
    setVersionId(id);
    const v = parseVersionId(id).version;
    const o: Record<string, boolean> = {};
    for (const b of BLOCKS) o[b.id] = isAvailableIn(b, v);
    setEnabled(o);
  };

  const javaEntries = VERSION_ENTRIES.filter((e) => e.edition === "java");
  const bedrockEntries = VERSION_ENTRIES.filter((e) => e.edition === "bedrock");

  const [imgData, setImgData] = useState<ImageData | null>(null);
  const [imgName, setImgName] = useState<string>("");
  const [width, setWidth] = useState(48);
  const [height, setHeight] = useState(48);
  const [lockRatio, setLockRatio] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 256;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      setImgData(ctx.getImageData(0, 0, w, h));
      setImgName(file.name);
      const aspect = w / h;
      if (lockRatio) {
        const base = Math.max(width, height);
        if (aspect >= 1) {
          setWidth(base);
          setHeight(Math.max(1, Math.round(base / aspect)));
        } else {
          setHeight(base);
          setWidth(Math.max(1, Math.round(base * aspect)));
        }
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const imgAspect = imgData ? imgData.width / imgData.height : 1;

  const onWidthChange = (v: number) => {
    setWidth(v);
    if (lockRatio && imgData) {
      setHeight(Math.max(1, Math.round(v / imgAspect)));
    }
  };
  const onHeightChange = (v: number) => {
    setHeight(v);
    if (lockRatio && imgData) {
      setWidth(Math.max(1, Math.round(v * imgAspect)));
    }
  };
  const onLockToggle = (on: boolean) => {
    setLockRatio(on);
    if (on && imgData) {
      setHeight(Math.max(1, Math.round(width / imgAspect)));
    }
  };

  const palette = useMemo(() => {
    return BLOCKS.filter((b) => enabled[b.id]).map((b) => ({
      block: b,
      rgb: hexToRgb(b.hex),
    }));
  }, [enabled]);

  // Resample input to target resolution and map each pixel to nearest enabled block.
  const grid = useMemo<PixelGrid>(() => {
    if (!imgData || palette.length === 0) return [];
    const tw = Math.max(1, width);
    const th = Math.max(1, height);

    const c = document.createElement("canvas");
    c.width = tw; c.height = th;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const src = document.createElement("canvas");
    src.width = imgData.width; src.height = imgData.height;
    src.getContext("2d")!.putImageData(imgData, 0, 0);
    ctx.drawImage(src, 0, 0, tw, th);
    const data = ctx.getImageData(0, 0, tw, th).data;

    const out: PixelGrid = [];
    for (let y = 0; y < th; y++) {
      const row: (PixelGrid[number][number])[] = [];
      for (let x = 0; x < tw; x++) {
        const i = (y * tw + x) * 4;
        const a = data[i + 3];
        if (a < 32) { row.push(null); continue; }
        const block = nearestBlock(data[i], data[i + 1], data[i + 2], palette);
        row.push(block ? { id: block.id, hex: block.hex } : null);
      }
      out.push(row);
    }
    return out;
  }, [imgData, palette, width, height]);

  const materials = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of grid) for (const c of r) if (c) counts.set(c.id, (counts.get(c.id) ?? 0) + 1);
    const nameOf = new Map(BLOCKS.map((b) => [b.id, b.name] as const));
    const hexOf = new Map(BLOCKS.map((b) => [b.id, b.hex] as const));
    return Array.from(counts.entries())
      .map(([id, count]) => ({ id, count, name: nameOf.get(id) ?? id, hex: hexOf.get(id) ?? "#999" }))
      .sort((a, b) => b.count - a.count);
  }, [grid]);
  const blockCount = useMemo(() => materials.reduce((s, m) => s + m.count, 0), [materials]);
  const stacksOf = (n: number) => {
    const stacks = Math.floor(n / 64);
    const rem = n % 64;
    return stacks > 0 ? `${stacks}×64${rem ? ` + ${rem}` : ""}` : `${rem}`;
  };

  // Group blocks by category from data
  const grouped = useMemo(() => {
    const groups: Record<string, BlockDef[]> = {};
    for (const b of BLOCKS) {
      (groups[b.category] ||= []).push(b);
    }
    return groups;
  }, []);

  const toggleBlock = (id: string) => setEnabled((p) => ({ ...p, [id]: !p[id] }));
  const enableGroup = (list: BlockDef[], on: boolean) =>
    setEnabled((p) => {
      const o = { ...p };
      for (const b of list) if (isAvailableIn(b, version)) o[b.id] = on;
      return o;
    });

  const enableAll = (on: boolean) =>
    setEnabled((p) => {
      const o = { ...p };
      for (const b of BLOCKS) if (isAvailableIn(b, version)) o[b.id] = on;
      return o;
    });

  return (
    <div className="min-h-screen bg-background text-foreground">
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
                <Link to="/pixel-art" className="flex items-center gap-3 rounded-md border border-primary/40 bg-accent/40 px-3 py-2 text-sm font-medium">
                  <ImageIcon className="h-4 w-4" /> Image to Pixel Art
                </Link>
                <Link to="/gradient" className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent/40">
                  <Palette className="h-4 w-4" /> Block Gradient
                </Link>
                <Link to="/skin-editor" className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent/40">
                  <Shirt className="h-4 w-4" /> Skin Editor
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-primary-foreground" style={{ backgroundImage: "var(--gradient-primary)" }}>
            <ImageIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold tracking-tight">Minecraft Tools</h1>
            <p className="text-xs text-muted-foreground -mt-0.5 truncate">Image to Pixel Art</p>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-4 sm:gap-6 px-3 sm:px-4 py-4 sm:py-6 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-4">
          <Card className="p-4 space-y-4" style={{ backgroundImage: "var(--gradient-surface)" }}>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Image</Label>
              <div className="mt-2 space-y-2">
                <Input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPick(f);
                  }}
                  className="hidden"
                />
                <Button onClick={() => fileRef.current?.click()} className="w-full" variant="outline">
                  <Upload className="h-4 w-4" />
                  {imgName ? "Replace image" : "Upload image"}
                </Button>
                {imgName && (
                  <p className="truncate text-xs text-muted-foreground">{imgName}</p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Version</Label>
              <Select value={versionId} onValueChange={onVersionChange}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Java Edition
                  </div>
                  {javaEntries.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                  ))}
                  <div className="mt-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Bedrock Edition
                  </div>
                  {bedrockEntries.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Switching versions resets the palette to blocks available in that version.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="lock-ratio" className="text-sm font-medium">Lock to image ratio</Label>
                <Switch
                  id="lock-ratio"
                  checked={lockRatio}
                  onCheckedChange={onLockToggle}
                  disabled={!imgData}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Width</Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={width}
                      min={8}
                      max={256}
                      onChange={(e) =>
                        onWidthChange(Math.max(8, Math.min(256, Number(e.target.value) || 8)))
                      }
                      className="h-7 w-16 text-right tabular-nums"
                    />
                    <span className="text-xs text-muted-foreground">blocks</span>
                  </div>
                </div>
                <Slider
                  className="mt-2"
                  value={[width]}
                  min={8}
                  max={256}
                  step={1}
                  onValueChange={(v) => onWidthChange(v[0])}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Height</Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={height}
                      min={8}
                      max={256}
                      onChange={(e) =>
                        onHeightChange(Math.max(8, Math.min(256, Number(e.target.value) || 8)))
                      }
                      className="h-7 w-16 text-right tabular-nums"
                    />
                    <span className="text-xs text-muted-foreground">blocks</span>
                  </div>
                </div>
                <Slider
                  className="mt-2"
                  value={[height]}
                  min={8}
                  max={256}
                  step={1}
                  onValueChange={(v) => onHeightChange(v[0])}
                />
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Blocks placed</span>
              <span className="text-lg font-semibold tabular-nums">{blockCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Palette size</span>
              <span className="text-lg font-semibold tabular-nums">{palette.length}</span>
            </div>
          </Card>

          {materials.length > 0 && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Material list</Label>
                <span className="text-[11px] text-muted-foreground">{materials.length} types</span>
              </div>
              <div className="max-h-72 overflow-y-auto pr-1">
                <ul className="space-y-1">
                  {materials.map((m) => {
                    return (
                      <li key={m.id} className="flex items-center gap-2 rounded-md border border-border bg-card/50 px-2 py-1 text-xs">
                        <span
                          className="h-5 w-5 shrink-0 rounded-sm border border-border bg-center bg-no-repeat"
                          style={blockSwatchStyle(m.id, m.hex)}
                        />
                        <span className="flex-1 truncate">{m.name}</span>
                        <span className="tabular-nums text-muted-foreground">{stacksOf(m.count)}</span>
                        <span className="w-12 text-right tabular-nums font-medium">{m.count.toLocaleString()}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <button
                onClick={() => {
                  const csv = "Block,Count,Stacks\n" + materials.map((m) => `"${m.name}",${m.count},"${stacksOf(m.count)}"`).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "materials.csv"; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full rounded-md border border-border px-2 py-1 text-[11px] hover:bg-accent/40"
              >Export CSV</button>
            </Card>
          )}

          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Block palette</Label>
              <div className="flex gap-1">
                <button
                  onClick={() => enableAll(true)}
                  className="rounded-md border border-border px-2 py-0.5 text-[11px] hover:bg-accent/40"
                >Select all</button>
                <button
                  onClick={() => enableAll(false)}
                  className="rounded-md border border-border px-2 py-0.5 text-[11px] hover:bg-accent/40"
                >Clear all</button>
              </div>
            </div>
            {Object.entries(grouped).map(([group, list]) => {
              const visible = list.filter((b) => isAvailableIn(b, version));
              if (!visible.length) return null;
              return (
                <div key={group} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{group}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => enableGroup(visible, true)}
                        className="rounded-md border border-border px-2 py-0.5 text-[11px] hover:bg-accent/40"
                      >All</button>
                      <button
                        onClick={() => enableGroup(visible, false)}
                        className="rounded-md border border-border px-2 py-0.5 text-[11px] hover:bg-accent/40"
                      >None</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {visible.map((b) => {
                      const on = !!enabled[b.id];
                      return (
                        <button
                          key={b.id}
                          onClick={() => toggleBlock(b.id)}
                          title={b.name}
                          className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-all ${
                            on
                              ? "border-primary/50 bg-accent/30"
                              : "border-border bg-card opacity-50 hover:opacity-100"
                          }`}
                        >
                          <span
                            className="h-4 w-4 shrink-0 rounded-sm border border-border bg-center bg-no-repeat"
                            style={blockSwatchStyle(b.id, b.hex)}
                          />
                          <span className="truncate">{b.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </Card>
        </aside>

        <main className="space-y-4">
          <Card className="overflow-hidden">
            <div
              className="relative min-h-[360px] h-[calc(100svh-9rem)]"
              style={{ backgroundImage: "var(--gradient-surface)" }}
            >
              {grid.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
                  <ImageIcon className="h-10 w-10" />
                  <p className="text-sm">
                    {imgData
                      ? "Enable at least one block in the palette to see the preview."
                      : "Upload an image to convert it into Minecraft block pixel art."}
                  </p>
                  {!imgData && (
                    <Button onClick={() => fileRef.current?.click()} className="shadow-[var(--shadow-elegant)]">
                      <Upload className="h-4 w-4" /> Upload image
                    </Button>
                  )}
                </div>
              ) : (
                <PixelArt3D grid={grid} />
              )}
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}