import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: false,
    outDir: './../static/keke_dist', 
    emptyOutDir: true, // Clear the output directory before building
  },
  base: './', // Adjust the base path if necessary
})
