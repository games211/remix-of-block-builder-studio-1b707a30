import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
  Search,
  Eye,
  EyeOff,
  Undo2,
  Redo2,
  Pencil,
  Eraser,
  Pipette,
  MousePointer2,
  Grid3x3,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  SkinViewer3D,
  type BodyPartKey,
  type Visibility,
  type EditTool,
  type SkinViewer3DHandle,
} from "@/components/SkinViewer3D";
import steveSkin from "@/assets/steve.png";
import alexSkin from "@/assets/alex.png";
import ariSkin from "@/assets/ari.png";
import efeSkin from "@/assets/efe.png";
import kaiSkin from "@/assets/kai.png";
import makenaSkin from "@/assets/makena.png";
import noorSkin from "@/assets/noor.png";
import sunnySkin from "@/assets/sunny.png";
import zuriSkin from "@/assets/zuri.png";

export const Route = createFileRoute("/skin-editor")({
  component: SkinEditor,
  head: () => ({
    meta: [
      { title: "Minecraft Tools — Skin Viewer" },
      {
        name: "description",
        content:
          "View Minecraft skins in 3D. Import a skin from a PNG file, grab any player's skin by username, and toggle body parts and outer layers.",
      },
    ],
  }),
});

const PART_LIST: { key: BodyPartKey; label: string }[] = [
  { key: "head", label: "Head" },
  { key: "body", label: "Body" },
  { key: "rightArm", label: "Right Arm" },
  { key: "leftArm", label: "Left Arm" },
  { key: "rightLeg", label: "Right Leg" },
  { key: "leftLeg", label: "Left Leg" },
];

const DEFAULT_SKINS: { name: string; url: string }[] = [
  { name: "Steve", url: steveSkin },
  { name: "Alex", url: alexSkin },
  { name: "Ari", url: ariSkin },
  { name: "Efe", url: efeSkin },
  { name: "Kai", url: kaiSkin },
  { name: "Makena", url: makenaSkin },
  { name: "Noor", url: noorSkin },
  { name: "Sunny", url: sunnySkin },
  { name: "Zuri", url: zuriSkin },
];

function SkinEditor() {
  const { theme, toggle: toggleTheme } = useTheme();

  const [skinUrl, setSkinUrlState] = useState<string>(steveSkin);
  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);
  const viewerRef = useRef<SkinViewer3DHandle | null>(null);

  const [tool, setTool] = useState<EditTool>("none");
  const [color, setColor] = useState<string>("#7a4a2b");
  const [showGrid, setShowGrid] = useState<boolean>(false);

  const setSkinUrl = useCallback(
    (next: string) => {
      setSkinUrlState((current) => {
        if (current === next) return current;
        setPast((p) => [...p.slice(-49), current]);
        setFuture([]);
        return next;
      });
    },
    [],
  );

  const undo = useCallback(() => {
    setPast((p) => {
      if (!p.length) return p;
      const prev = p[p.length - 1];
      setSkinUrlState((curr) => {
        setFuture((f) => [curr, ...f].slice(0, 50));
        return prev;
      });
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0];
      setSkinUrlState((curr) => {
        setPast((p) => [...p.slice(-49), curr]);
        return next;
      });
      return f.slice(1);
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z") ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y")
      ) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOuter, setShowOuter] = useState(false);
  const [visible, setVisible] = useState<Visibility>({
    head: true, body: true, rightArm: true, leftArm: true, rightLeg: true, leftLeg: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setPart = (k: BodyPartKey, v: boolean) =>
    setVisible((prev) => ({ ...prev, [k]: v }));

  const allOn = () =>
    setVisible({ head: true, body: true, rightArm: true, leftArm: true, rightLeg: true, leftLeg: true });
  const allOff = () =>
    setVisible({ head: false, body: false, rightArm: false, leftArm: false, rightLeg: false, leftLeg: false });

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSkinUrl(reader.result);
        toast.success("Skin loaded");
      }
    };
    reader.onerror = () => toast.error("Could not read image");
    reader.readAsDataURL(file);
  };

  const fetchByUsername = async () => {
    const name = username.trim();
    if (!name) {
      toast.error("Enter a Minecraft username");
      return;
    }
    setLoading(true);
    // minotar.net serves CORS-friendly skin PNGs for any player
    const url = `https://minotar.net/skin/${encodeURIComponent(name)}?_=${Date.now()}`;
    // Probe with Image first for clean error UX
    const probe = new Image();
    probe.crossOrigin = "anonymous";
    probe.onload = () => {
      setSkinUrl(url);
      toast.success(`Loaded skin for ${name}`);
      setLoading(false);
    };
    probe.onerror = () => {
      toast.error("Could not fetch skin (check username)");
      setLoading(false);
    };
    probe.src = url;
  };

  const resetSteve = () => {
    setSkinUrl(steveSkin);
    toast.success("Reset to Steve");
  };

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

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
                  <Shirt className="h-4 w-4" /> Skin Viewer
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
            <p className="text-xs text-muted-foreground -mt-0.5 truncate">Skin Viewer</p>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-4 sm:gap-6 px-3 sm:px-4 py-4 sm:py-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <Card className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={undo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="h-4 w-4" />
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={redo}
                disabled={!canRedo}
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 className="h-4 w-4" />
                Redo
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {([
                { id: "none", label: "Move", icon: MousePointer2 },
                { id: "pencil", label: "Paint", icon: Pencil },
                { id: "eraser", label: "Erase", icon: Eraser },
                { id: "eyedropper", label: "Pick", icon: Pipette },
              ] as const).map((t) => {
                const Icon = t.icon;
                const on = tool === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTool(t.id)}
                    title={t.label}
                    className={`flex flex-col items-center gap-1 rounded-md border px-1 py-1.5 text-[10px] font-medium transition-colors ${
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
            <div className="flex items-center gap-2">
              <Label className="text-xs">Color</Label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-7 w-10 cursor-pointer rounded border border-border bg-transparent"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-7 flex-1 font-mono text-xs"
              />
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <div className="flex items-center gap-2">
                <Grid3x3 className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Pixel grid</Label>
              </div>
              <Switch checked={showGrid} onCheckedChange={setShowGrid} />
            </div>
            <Button
              variant="default"
              size="sm"
              className="w-full gap-2"
              onClick={() => {
                const dataUrl = viewerRef.current?.exportPng();
                if (!dataUrl) {
                  toast.error("Nothing to export yet");
                  return;
                }
                const a = document.createElement("a");
                a.href = dataUrl;
                a.download = `skin-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                a.remove();
              }}
            >
              <Download className="h-4 w-4" />
              Export PNG
            </Button>
          </Card>

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
            <Button variant="ghost" size="sm" className="w-full" onClick={resetSteve}>
              Reset to Steve
            </Button>
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
              Loads the player's current Java Edition skin.
            </p>
          </Card>

          <Card className="p-4 space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Default skins
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {DEFAULT_SKINS.map((s) => {
                const active = skinUrl === s.url;
                return (
                  <button
                    key={s.name}
                    onClick={() => {
                      setSkinUrl(s.url);
                      toast.success(`Loaded ${s.name}`);
                    }}
                    title={s.name}
                    className={`group flex flex-col items-center gap-1 rounded-md border p-2 transition-colors ${
                      active
                        ? "border-primary bg-accent/40"
                        : "border-border hover:bg-accent/40"
                    }`}
                  >
                    <div
                      className="h-12 w-12 rounded-sm bg-no-repeat [image-rendering:pixelated]"
                      style={{
                        backgroundImage: `url(${s.url})`,
                        // crop to head front: 8x8 at (8,8) on 64x64 atlas → scale 6x → 48px, bg-size 384x384, position -48 -48
                        backgroundSize: "384px 384px",
                        backgroundPosition: "-48px -48px",
                      }}
                    />
                    <span className="text-[11px] font-medium">{s.name}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Body parts
              </Label>
              <div className="flex gap-1">
                <button
                  onClick={allOn}
                  className="rounded-md border border-border px-2 py-0.5 text-[11px] hover:bg-accent/40"
                  title="Show all"
                >
                  <Eye className="h-3 w-3" />
                </button>
                <button
                  onClick={allOff}
                  className="rounded-md border border-border px-2 py-0.5 text-[11px] hover:bg-accent/40"
                  title="Hide all"
                >
                  <EyeOff className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {PART_LIST.map((p) => (
                <div
                  key={p.key}
                  className="flex items-center justify-between rounded-md border border-border bg-card/40 px-3 py-1.5"
                >
                  <span className="text-sm">{p.label}</span>
                  <Switch
                    checked={visible[p.key]}
                    onCheckedChange={(v) => setPart(p.key, v)}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Outer layer</Label>
                <p className="text-[11px] text-muted-foreground">
                  Hat, jacket, sleeves and pants overlay
                </p>
              </div>
              <Switch checked={showOuter} onCheckedChange={setShowOuter} />
            </div>
          </Card>
        </aside>

        <main>
          <Card className="overflow-hidden" style={{ backgroundImage: "var(--gradient-surface)" }}>
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
              <div>
                <h2 className="text-base font-semibold">3D viewer</h2>
                <p className="text-xs text-muted-foreground">
                  Drag to rotate · Scroll to zoom
                </p>
              </div>
            </div>
            <div className="h-[640px]">
              <SkinViewer3D
                ref={viewerRef}
                skinUrl={skinUrl}
                showOuter={showOuter}
                visible={visible}
                showGrid={showGrid}
                tool={tool}
                color={color}
                onPickColor={(hex) => {
                  setColor(hex);
                  setTool("pencil");
                }}
                onEdit={(dataUrl) => setSkinUrl(dataUrl)}
              />
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}