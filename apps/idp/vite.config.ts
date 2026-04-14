import path from 'node:path'
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  // requires trailing slash for loading assets properly in production
  base: `/idp${mode === 'production' ? '/' : ''}`,
  server: {
    port: 3002,
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@oauth-sample/ui/index.css': path.resolve(
        __dirname,
        '../../packages/ui/src/index.css',
      ),
    },
  },
  plugins: [tailwindcss(), reactRouter()],
}))
