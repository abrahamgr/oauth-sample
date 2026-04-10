import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  resolve: {
    alias: {
      '@oauth-sample/ui/index.css': path.resolve(
        __dirname,
        '../ui/src/index.css',
      ),
    },
  },
  server: {
    port: 3000,
  },
})
