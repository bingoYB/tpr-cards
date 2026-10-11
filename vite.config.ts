import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string
}

// https://vite.dev/config/
export default defineConfig({
  // Pages uses its repository path; local builds stay portable by default.
  base: process.env.VITE_BASE_PATH || './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'TPR 指令卡',
        short_name: 'TPR卡',
        description: 'TPR (Total Physical Response) 全身反应教学指令卡，支持离线使用',
        lang: 'zh-CN',
        theme_color: '#ff7a45',
        background_color: '#fff7f0',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,woff2}'],
        // Precached images use content revisions; match their application version query too.
        ignoreURLParametersMatching: [/^v$/, /^utm_/, /^fbclid$/],
        // Keep installation small; other illustrated cards cache when viewed.
        globIgnores: ['**/illustrations/responsive/commands/*.webp'],
        runtimeCaching: [{
          urlPattern: ({ url, sameOrigin }) => sameOrigin && /\/illustrations\/responsive\/commands\/[^/]+\.webp$/.test(url.pathname),
          handler: 'CacheFirst',
          options: {
            cacheName: 'tpr-responsive-illustrations',
            expiration: { maxEntries: 450, maxAgeSeconds: 365 * 24 * 60 * 60 },
            cacheableResponse: { statuses: [200] },
          },
        }],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        // Serve the app shell for any navigation request so deep links work offline
        navigateFallback: 'index.html',
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
