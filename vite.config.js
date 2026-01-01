import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/netadmin-pro/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "NetAdmin Pro",
        short_name: "NetAdmin",
        start_url: "/netadmin-pro/",
        display: "standalone",
        theme_color: "#2563eb",
        background_color: "#0f172a",
        icons: [
          {
            src: "/netadmin-pro/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
