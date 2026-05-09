// Deploy target: Netlify. We disable the Cloudflare plugin from the Lovable
// wrapper and tell TanStack Start to use the Netlify preset, which emits the
// build artifacts Netlify expects (static assets + a Netlify Function for SSR).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    target: "netlify",
  },
});
