import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
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
        start_url: '/guia-de-aplicacao/',
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
  base: '/guia-de-aplicacao/',
})
