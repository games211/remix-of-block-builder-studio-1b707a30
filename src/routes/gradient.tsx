import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import {
  Boxes,
  Image as ImageIcon,
  Menu,
  Moon,
  Sun,
  Home as HomeIcon,
  Palette,
  ArrowRight,
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
  BLOCKS,
  blockSwatchStyle,
  hexToRgb,
  nearestBlock,
  type BlockDef,
} from "@/lib/blocks";

export const Route = createFileRoute("/gradient")({
  component: GradientTool,
  head: () => ({
    meta: [
      { title: "Minecraft Tools — Block Gradient Generator" },
      {
        name: "description",
        content:
          "Generate smooth Minecraft block gradients between any two blocks. Choose your start and end blocks, set the length, and get the perfect transition.",
      },
    ],
  }),
});

function BlockPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BLOCKS;
    return BLOCKS.filter(
      (b) => b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q),
    );
  }, [query]);
  const selected = BLOCKS.find((b) => b.id === value);
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-2 rounded-md border border-border bg-card/50 px-2 py-1.5">
        <span
          className="h-8 w-8 shrink-0 rounded-sm border border-border bg-center bg-no-repeat"
          style={selected ? blockSwatchStyle(selected.id, selected.hex) : undefined}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {selected?.name ?? "—"}
          </div>
          <div className="truncate text-[11px] text-muted-foreground">
            {selected?.category}
          </div>
        </div>
      </div>
      <Input
        placeholder="Search blocks…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-8 text-xs"
      />
      <div className="max-h-44 overflow-y-auto rounded-md border border-border bg-card/30 p-1">
        <div className="grid grid-cols-6 gap-1">
          {filtered.slice(0, 240).map((b) => {
            const on = b.id === value;
            return (
              <button
                key={b.id}
                onClick={() => onChange(b.id)}
                title={b.name}
                className={`aspect-square rounded-sm border bg-center bg-no-repeat transition-all ${
                  on
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-border hover:border-primary/50"
                }`}
                style={blockSwatchStyle(b.id, b.hex)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GradientTool() {
  const { theme, toggle: toggleTheme } = useTheme();

  const [fromId, setFromId] = useState<string>("grass_block");
  const [toId, setToId] = useState<string>("netherrack");
  const [length, setLength] = useState<number>(16);
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(false);

  const palette = useMemo(
    () => BLOCKS.map((b) => ({ block: b, rgb: hexToRgb(b.hex) })),
    [],
  );

  const from = BLOCKS.find((b) => b.id === fromId) ?? BLOCKS[0];
  const to = BLOCKS.find((b) => b.id === toId) ?? BLOCKS[0];

  // Default fallback if "netherrack" isn't in BLOCKS list
  const safeTo = to ?? BLOCKS[BLOCKS.length - 1];

  const gradient = useMemo<BlockDef[]>(() => {
    if (!from || !safeTo) return [];
    const [r1, g1, b1] = hexToRgb(from.hex);
    const [r2, g2, b2] = hexToRgb(safeTo.hex);
    const out: BlockDef[] = [];
    let last: BlockDef | null = null;
    for (let i = 0; i < length; i++) {
      const t = length === 1 ? 0 : i / (length - 1);
      const r = Math.round(r1 + (r2 - r1) * t);
      const g = Math.round(g1 + (g2 - g1) * t);
      const b = Math.round(b1 + (b2 - b1) * t);
      let block: BlockDef | null;
      if (i === 0) block = from;
      else if (i === length - 1) block = safeTo;
      else block = nearestBlock(r, g, b, palette);
      // Avoid stretches of the same block where possible — try second-nearest
      if (block && last && block.id === last.id && i !== 0 && i !== length - 1) {
        // pick next-nearest
        let best: BlockDef | null = null;
        let bestD = Infinity;
        for (const p of palette) {
          if (p.block.id === last.id) continue;
          const dr = p.rgb[0] - r;
          const dg = p.rgb[1] - g;
          const db = p.rgb[2] - b;
          const d = dr * dr + dg * dg + db * db;
          if (d < bestD) {
            bestD = d;
            best = p.block;
          }
        }
        if (best) block = best;
      }
      if (block) out.push(block);
      last = block;
    }
    if (removeDuplicates) {
      const seen = new Set<string>();
      const deduped: BlockDef[] = [];
      for (const b of out) {
        if (seen.has(b.id)) continue;
        seen.add(b.id);
        deduped.push(b);
      }
      return deduped;
    }
    return out;
  }, [from, safeTo, length, palette, removeDuplicates]);

  const copyList = () => {
    const text = gradient.map((b, i) => `${i + 1}. ${b.name}`).join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
  };

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
                <Link to="/pixel-art" className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent/40">
                  <ImageIcon className="h-4 w-4" /> Image to Pixel Art
                </Link>
                <Link to="/gradient" className="flex items-center gap-3 rounded-md border border-primary/40 bg-accent/40 px-3 py-2 text-sm font-medium">
                  <Palette className="h-4 w-4" /> Block Gradient
                </Link>
                <Link to="/skin-editor" className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent/40">
                  <Shirt className="h-4 w-4" /> Skin Editor
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <Palette className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold tracking-tight">Minecraft Tools</h1>
            <p className="text-xs text-muted-foreground -mt-0.5 truncate">Block Gradient</p>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-4 sm:gap-6 px-3 sm:px-4 py-4 sm:py-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <Card className="p-4 space-y-4" style={{ backgroundImage: "var(--gradient-surface)" }}>
            <BlockPicker label="From block" value={fromId} onChange={setFromId} />
            <div className="flex items-center justify-center text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
            </div>
            <BlockPicker label="To block" value={toId} onChange={setToId} />
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Gradient length</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={length}
                  min={2}
                  max={64}
                  onChange={(e) =>
                    setLength(Math.max(2, Math.min(64, Number(e.target.value) || 2)))
                  }
                  className="h-7 w-16 text-right tabular-nums"
                />
                <span className="text-xs text-muted-foreground">blocks</span>
              </div>
            </div>
            <Slider
              value={[length]}
              min={2}
              max={64}
              step={1}
              onValueChange={(v) => setLength(v[0])}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[4, 8, 16, 24, 32, 48, 64].map((n) => (
                <button
                  key={n}
                  onClick={() => setLength(n)}
                  className={`rounded-md border px-2 py-0.5 text-[11px] transition-colors ${
                    length === n
                      ? "border-primary bg-accent/40"
                      : "border-border hover:bg-accent/40"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <div className="space-y-0.5">
                <Label htmlFor="dedupe" className="text-sm font-medium">Remove duplicates</Label>
                <p className="text-[11px] text-muted-foreground">
                  Show each block only once
                </p>
              </div>
              <Switch
                id="dedupe"
                checked={removeDuplicates}
                onCheckedChange={setRemoveDuplicates}
              />
            </div>
          </Card>

          <Card className="p-4 space-y-2 text-xs text-muted-foreground">
            <p>
              Gradients interpolate between the two blocks' colors and pick the
              nearest matching block from the full palette at each step.
            </p>
            <p>The first and last blocks always match your selection.</p>
          </Card>
        </aside>

        <main className="space-y-4">
          <Card className="p-4 space-y-4" style={{ backgroundImage: "var(--gradient-surface)" }}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold">Gradient preview</h2>
                <p className="text-xs text-muted-foreground">
                  {from.name} → {safeTo.name} · {gradient.length} blocks
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={copyList}>
                Copy list
              </Button>
            </div>

            {/* Horizontal strip preview */}
            <div className="overflow-x-auto rounded-md border border-border bg-card/30 p-2">
              <div className="flex gap-0.5">
                {gradient.map((b, i) => {
                  return (
                    <div
                      key={i}
                      title={`${i + 1}. ${b.name}`}
                      className="aspect-square w-10 shrink-0 rounded-sm border border-border bg-center bg-no-repeat"
                      style={blockSwatchStyle(b.id, b.hex)}
                    />
                  );
                })}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Block list
            </Label>
            <ol className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {gradient.map((b, i) => {
                return (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-md border border-border bg-card/50 px-2 py-1.5 text-xs"
                  >
                    <span className="w-5 shrink-0 text-right tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <span
                      className="h-6 w-6 shrink-0 rounded-sm border border-border bg-center bg-no-repeat"
                      style={blockSwatchStyle(b.id, b.hex)}
                    />
                    <span className="flex-1 truncate font-medium">{b.name}</span>
                  </li>
                );
              })}
            </ol>
          </Card>
        </main>
      </div>
    </div>
  );
}