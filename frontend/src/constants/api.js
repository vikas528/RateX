/**
 * api.js — API route constants and the base URL helper.
 *
 * All paths MUST match the backend constants/routes.go.
 * The base URL is read from the Vite env var VITE_API_BASE_URL at build time;
 * falling back to "" means every path is relative to the same origin (i.e. the
 * nginx proxy or the Vite dev-server proxy handles the routing automatically).
 */

/** Base URL prefix for all backend calls.
 *  Override via VITE_API_BASE_URL in a .env / .env.local file.
 *  Examples:
 *    ""                         → relative to current origin (default)
 *    "http://localhost:8080"    → direct hit when running outside Docker
 */
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

// ── Route paths ──────────────────────────────────────────────────────────────
export const ROUTES = {
  HEALTH:            '/ratex/health',
  VISUALIZER_STATE:  '/ratex/visualizer-state',
  CONFIG:            '/ratex/config',
  PRODUCTS:          '/ratex/products',
  ORDERS:            '/ratex/orders',
  USERS_ME:          '/ratex/users/me',
}

/** Convenience: build a fully-qualified URL from a route constant. */
export const apiUrl = (route) => `${API_BASE}${route}`

// ── Test endpoints shown in the Burst panel ───────────────────────────────────
export const BURST_ENDPOINTS = [
  { label: 'GET /ratex/products',            method: 'GET',  url: ROUTES.PRODUCTS },
  { label: 'GET /ratex/users/me',            method: 'GET',  url: ROUTES.USERS_ME },
  { label: 'GET /ratex/health (not limited)',method: 'GET',  url: ROUTES.HEALTH },
]
