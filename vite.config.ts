import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/stockfish.js/stockfish.js',
          dest: '.'
        },
        {
          src: 'node_modules/stockfish.js/stockfish.wasm',
          dest: '.'
        },
        {
          src: 'node_modules/stockfish.js/stockfish.wasm.js',
          dest: '.'
        }
      ]
    })
  ],
  optimizeDeps: {
    exclude: ['stockfish.js']
  },
  server: {
    fs: {
      // Allow serving files from the stockfish package
      allow: ['..']
    }
  }
})
