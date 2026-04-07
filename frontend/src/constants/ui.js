/**
 * ui.js — UI-specific constants shared across components.
 */

/** Quick-pick preset values shown as chips in the Burst panel. */
export const BURST_PRESETS = [10, 50, 100, 500, 1000, 5000, 10000]

/** Maximum parallel fetch calls sent in one wave (concurrent mode).
 *  Keeps the browser from running out of connections on very large bursts. */
export const CONCURRENT_BATCH_SIZE = 100

/** Maximum number of result rows rendered in the table.
 *  Unlimited data is still collected; only display is capped. */
export const DISPLAY_LIMIT = 50

/** Default number of requests pre-filled in the Burst panel. */
export const DEFAULT_REQUEST_COUNT = 15

/** Polling interval (ms) between visualizer state fetches. */
export const VISUALIZER_POLL_MS = 350

// ── User-facing messages ──────────────────────────────────────────────────────
export const MSG_CONFIG_APPLIED   = '✓ Config applied — Redis keys flushed'
export const MSG_CONFIG_FAILED    = '✗ Failed'
export const MSG_NETWORK_ERROR    = '✗ Network error'
export const MSG_CONNECTING       = 'Connecting…'
export const MSG_CONFIG_CLEAR_AFTER_MS = 4000

// ── Status HTTP codes referenced in multiple components ───────────────────────
export const HTTP_OK      = 200
export const HTTP_CREATED = 201
export const HTTP_429     = 429
