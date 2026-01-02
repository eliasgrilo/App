import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  esbuild: {
    // Strip console.log and debugger in production builds
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  }
})