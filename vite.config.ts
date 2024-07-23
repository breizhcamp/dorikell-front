import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from "vite-svg-loader";

const dorikellApiUrl = 'http://' + (process.env.VITE_DORIKELL_API_URL || 'localhost:4009')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), svgLoader()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': dorikellApiUrl,
      '/kalon': {
        target: process.env.VITE_KALON_API_URL || 'http://localhost:4007/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kalon/, '')
      },
      '/bilhed': {
        target: process.env.VITE_BILHED_API_URL || 'http://localhost:4006',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bilhed/, '')
      }
    }
  }
})
