import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
