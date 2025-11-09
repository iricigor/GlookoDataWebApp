import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_ID__: JSON.stringify(process.env.GITHUB_RUN_NUMBER || 'dev'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    host: true, // Listen on all addresses, required for Codespaces
    port: 5173,
    strictPort: false,
    hmr: {
      clientPort: 443 // Required for Codespaces port forwarding over HTTPS
    }
  },
  build: {
    chunkSizeWarningLimit: 1000 // Increase chunk size warning limit to 1000 kB
  }
})
