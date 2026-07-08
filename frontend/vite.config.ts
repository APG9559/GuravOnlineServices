import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: 'auto',
        includeAssets: ['G.png'],
        manifest: {
          name: 'Gurav Online Services',
          short_name: 'Gurav Services',
          description: 'Gurav Online Services Portal',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            {
              src: '/G.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/G.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/G.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          globPatterns: isProduction ? ['**/*.{js,css,html,ico,png,svg,json}'] : [],
          navigateFallback: '/index.html',
        },
        devOptions: {
          enabled: true
        }
      })
    ],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('xlsx')) {
                return 'xlsx';
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('scheduler')) {
                return 'react-core';
              }
              if (id.includes('@tanstack')) {
                return 'tanstack';
              }
              return 'vendor';
            }
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});
