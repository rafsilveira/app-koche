import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
function normalizeBase(base) {
  if (!base) {
    return '/'
  }

  const withLeadingSlash = base.startsWith('/') ? base : `/${base}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = normalizeBase(env.VITE_APP_BASE || '/app/')

  return {
    plugins: [
      react(),
      /*
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          skipWaiting: true,
          clientsClaim: true
        },
        includeAssets: ['vite.svg', 'images/*.png'],
        manifest: {
          name: 'Guia de Aplicação Kóche',
          short_name: 'Guia Kóche',
          description: 'Guia de aplicação de fluidos e peças Kóche Automotiva',
          theme_color: '#1a0b3a',
          background_color: '#05020a',
          display: 'standalone',
          start_url: '/app/',
          icons: [
            {
              src: 'images/icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'images/icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
      */
    ],
    base,
    build: {
      outDir: env.VITE_BUILD_OUT_DIR || 'dist'
    }
  }
})
