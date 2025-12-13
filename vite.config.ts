import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@/features': path.resolve(__dirname, './src/features'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/shared': path.resolve(__dirname, './src/shared')
    }
  },
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
    chunkSizeWarningLimit: 5000 // Increase chunk size warning limit to 5000 kB (main bundle is ~4.7 MB)
  }
})
