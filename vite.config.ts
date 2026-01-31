import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['stockfish']
  },
  server: {
    fs: {
      // Allow serving files from the stockfish package
      allow: ['..']
    }
  }
})
