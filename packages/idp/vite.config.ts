import path from 'node:path'
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  server: {
    port: 3002,
  },
  resolve: {
    alias: {
      '@oauth-sample/ui/index.css': path.resolve(
        __dirname,
        '../ui/src/index.css',
      ),
    },
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
})
