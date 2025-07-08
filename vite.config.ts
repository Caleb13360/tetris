import { defineConfig } from 'vite'

export default defineConfig({
  base: '/tetris/', // This should match your repository name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
}) 
