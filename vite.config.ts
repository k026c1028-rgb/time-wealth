import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Time & Wealth',
        short_name: 'TimeWealth',
        description: 'Live earnings timer with goal planning. Data stays on this device.',
        theme_color: '#c026d3',
        background_color: '#09090b',
        display: 'standalone',
        icons: [
          // SVG icons are good enough for MVP; can be replaced with PNGs for broader support.
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
})
