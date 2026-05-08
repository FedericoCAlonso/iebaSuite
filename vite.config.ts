import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: '/pwaCroquizador/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'ieBA Croquis',
        short_name: 'ieBA',
        description: 'Editor de croquis eléctricos para inspectores IEBA. Trabaja offline.',
        start_url: '/pwaCroquizador/',
        scope: '/pwaCroquizador/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0f1117',
        theme_color: '#f5c400',
        lang: 'es',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cachea todos los assets estáticos (JS, CSS, fuentes, imágenes)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Estrategia para navegación: siempre sirve el index.html en offline
        navigateFallback: 'index.html',
        // Cache de Google Fonts con estrategia CacheFirst (válido 1 año)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // Modo desarrollo: muestra el SW en dev para testing
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
});
