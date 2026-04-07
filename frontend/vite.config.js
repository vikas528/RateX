import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // When running `npm run dev` locally, proxy /ratex to the Go server
  server: {
    proxy: {
      '/ratex': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
