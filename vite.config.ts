import { defineConfig } from 'vite'

export default defineConfig({
  base: '/', // This will be your repository name if using GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
}) 