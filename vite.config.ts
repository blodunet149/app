import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  base: './', // Gunakan relative path agar kompatibel dengan deployment Cloudflare Pages
  build: {
    outDir: './dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['date-fns'],
        }
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      }
    }
  },
  // Tambahkan konfigurasi tambahan untuk memicu rebuild
  css: {
    modules: {
      localsConvention: 'camelCase',
    }
  }
})