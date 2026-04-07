import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load non-VITE_ env vars as well so we can read VITE_API_TARGET
  // from the shell environment (injected by docker-compose).
  const env = loadEnv(mode, process.cwd(), '')

  // Where to proxy /ratex/* requests during development.
  //   • Outside Docker  → set VITE_API_TARGET=http://localhost:8080
  //   • Inside Docker   → docker-compose injects VITE_API_TARGET=http://app:8080
  //   • Fallback        → localhost:8080 (mirrors the default backend port)
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:8080'

  // Base path for asset URLs.
  //   • Local / Docker  → '/'  (default)
  //   • GitHub Pages    → '/RateX/'  (set via VITE_BASE_PATH in CI)
  const base = process.env.VITE_BASE_PATH || '/'

  return {
    base,
    plugins: [react()],
    server: {
      host: '0.0.0.0', // bind to all interfaces so Docker port-forwarding works
      port: 5173,
      proxy: {
        '/ratex': {
          target:      apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
