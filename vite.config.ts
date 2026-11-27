import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'ece-logo.jpg', 'digitalbwsla.png'],
      manifest: {
        id: './',
        name: 'ECE Technical Office',
        short_name: 'ECE Office',
        description: 'Elite Consolidated Engineers — inter-department coordination',
        theme_color: '#003164',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        dir: 'ltr',
        lang: 'en',
        categories: ['business', 'productivity'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
        shortcuts: [
          { name: 'New inquiry', url: './#/inquiries/new', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Inquiries', url: './#/inquiries', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Submittals', url: './#/submittals', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Notifications', url: './#/notifications', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,ico,woff2}'],
        globIgnores: ['og-image.jpg'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: { host: true },
})
