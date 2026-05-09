// Deploy target: Cloudflare Pages. TanStack Start's "cloudflare-module"
// preset emits a Worker-compatible SSR handler plus static assets that
// Cloudflare Pages serves directly.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    target: "cloudflare-module",
  },
});
