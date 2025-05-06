import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'ADHD Planner',
        short_name: 'ADHDplanner',
        description: 'A task management and planning app designed for ADHD users',
        theme_color: '#4F46E5',
        background_color: '#ffffff',
        display: 'standalone',
        scope: './',
        start_url: './',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  base: '/ADHDplanner/',

  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'index.html',
      },
      output: {
        // Ensure MIME types are correctly set
        assetFileNames: (assetInfo) => {
          let extType = (assetInfo.name ?? '').split('.').at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType ?? '')) {
            extType = 'img';
          } else if (/woff|woff2/.test(extType ?? '')) {
            extType = 'fonts';
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    },
    headers: {
      // Add CORS headers for development
      'Access-Control-Allow-Origin': '*'
    }
  },
});
