// Deploy target: Vercel. We disable the Cloudflare plugin from the Lovable
// wrapper and tell TanStack Start to use the Vercel preset, which emits the
// Build Output API artifacts under `.vercel/output/` for Vercel to pick up.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    target: "vercel",
  },
});
