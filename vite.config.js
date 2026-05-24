import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Permite popup de Firebase Auth (Google) sin error COOP en dev. */
const authPopupHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'Cross-Origin-Embedder-Policy': 'unsafe-none',
}

export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'EXPO_PUBLIC_'],
  server: {
    headers: authPopupHeaders,
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
      },
    },
  },
  preview: {
    headers: authPopupHeaders,
  },
})
