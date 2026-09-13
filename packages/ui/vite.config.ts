import preact from '@preact/preset-vite'
import path from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  build: {
    outDir: "../code-overview/out/ui",
    emptyOutDir: true
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, 'src')
    }
  }
})
