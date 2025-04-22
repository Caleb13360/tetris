import { defineConfig } from 'vite'

export default defineConfig({
  base: '/32526865_CalebSmith/', // This should match your repository name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
}) 