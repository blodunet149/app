import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { cloudflare } from '@hono/vite-cloudflare-pages'

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    cloudflare(),
  ],
  build: {
    outDir: './dist/server',
  },
})