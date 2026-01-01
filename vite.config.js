import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/netadmin-pro/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'NetAdmin Pro',
        short_name: 'NetAdmin',
        description: 'Enterprise Network Administration Dashboard',
        theme_color: '#2563eb',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/netadmin-pro/'
      }
    })
  ]
})
