import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  base: process.env.GITHUB_PAGES === 'true' ? '/ADHDplanner/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Ensure that index.html is copied to dist
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },
});
