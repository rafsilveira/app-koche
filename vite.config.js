import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  // Expõe a versão do package.json pro app - evita rodapé com versão
  // hardcoded que fica desatualizada a cada release (ex: "v1.3" fixo
  // enquanto o app já estava na v1.6).
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
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
