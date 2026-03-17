import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/.next/**',
      '**/.worktrees/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@repo/database': path.resolve(__dirname, './apps/database'),
    },
  },
  ssr: {
    noExternal: ['react', 'react-dom'],
  },
})
