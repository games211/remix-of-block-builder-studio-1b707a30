import { createFileRoute, Link } from "@tanstack/react-router";
import { useTheme } from "@/hooks/use-theme";
import {
  Boxes,
  Menu,
  Moon,
  Sun,
  Home as HomeIcon,
  ArrowRight,
  Sparkles,
  Image as ImageIcon,
  Palette,
  Shirt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Minecraft Tools — Build Better, Faster" },
      {
        name: "description",
        content:
          "A growing collection of free Minecraft tools to help you build, plan, and create. Start with the shape generator and more coming soon.",
      },
      { property: "og:title", content: "Minecraft Tools — Build Better, Faster" },
      {
        property: "og:description",
        content:
          "A growing collection of free Minecraft tools to help you build, plan, and create.",
      },
    ],
  }),
});

const TOOLS = [
  {
    to: "/shape-generator" as const,
    title: "Shape Generator",
    description:
      "Generate block layouts for spheres, ellipsoids, circles, cylinders and domes with layer-by-layer build guides.",
    icon: Boxes,
    available: true,
  },
  {
    to: "/pixel-art" as const,
    title: "Image to Pixel Art",
    description:
      "Upload any image and convert it into Minecraft block pixel art. Pick a version, toggle blocks, and preview in 3D.",
    icon: ImageIcon,
    available: true,
  },
  {
    to: "/gradient" as const,
    title: "Block Gradient",
    description:
      "Generate smooth Minecraft block gradients between any two blocks at any length.",
    icon: Palette,
    available: true,
  },
  {
    to: "/skin-editor" as const,
    title: "Skin Editor",
    description:
      "Edit Minecraft skins in your browser. Import from a PNG or grab any player's skin by username.",
    icon: Shirt,
    available: true,
  },
];

function Landing() {
  const { theme, toggle: toggleTheme } = useTheme();

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
                <Link
                  to="/"
                  className="flex items-center gap-3 rounded-md border border-primary/40 bg-accent/40 px-3 py-2 text-left text-sm font-medium"
                >
                  <HomeIcon className="h-4 w-4" />
                  Home
                </Link>
                <Link
                  to="/shape-generator"
                  className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-left text-sm font-medium hover:bg-accent/40"
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
                <div className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">
                  More tools coming soon
                </div>
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
              Build better, faster
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

      <main className="mx-auto max-w-[1100px] px-4 py-12 sm:py-20">
        {/* Hero */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            A growing toolkit for Minecraft builders
          </div>
          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight">
            Build smarter in{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              Minecraft
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground">
            Generate smooth Minecraft block gradients between any two blocks.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button asChild size="lg" className="shadow-[var(--shadow-elegant)]">
              <Link to="/shape-generator">
                Try the Shape Generator
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Tools grid */}
        <section className="mt-16 sm:mt-24">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
            Tools
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.to} to={tool.to} className="group">
                  <Card
                    className="h-full p-5 transition-all hover:border-primary/40 hover:shadow-[var(--shadow-elegant)]"
                    style={{ backgroundImage: "var(--gradient-surface)" }}
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground"
                      style={{ backgroundImage: "var(--gradient-primary)" }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="mt-4 text-base font-semibold">{tool.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tool.description}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Open
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Card>
                </Link>
              );
            })}
            <Card className="flex h-full flex-col items-center justify-center border-dashed p-5 text-center text-sm text-muted-foreground">
              More tools coming soon
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
