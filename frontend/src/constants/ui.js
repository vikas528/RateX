/**
 * ui.js — UI-specific constants shared across components.
 *
 * All capacity / delay limits are defined here so they can be tuned in one
 * place without touching component logic.
 */

// ── Burst-mode presets (chips shown in BurstPanel) ───────────────────────────
/** Sequential mode preset chips — max matches SEQUENTIAL_MAX_DEFAULT. */
export const BURST_PRESETS_SEQUENTIAL = [10, 25, 50, 100, 500, 1000, 2000]
/** Concurrent mode preset chips — max matches CONCURRENT_MAX_DEFAULT. */
export const BURST_PRESETS_CONCURRENT = [5, 10, 20, 30, 50]
/** Legacy alias kept so any stale import still resolves. */
export const BURST_PRESETS = BURST_PRESETS_SEQUENTIAL

// ── Concurrent limits ────────────────────────────────────────────────────────
/**
 * Default maximum number of concurrent requests allowed for any endpoint.
 * This server is intentionally small — blasting hundreds of concurrent sockets
 * would exhaust its connection pool and skew the rate-limit demo results.
 */
export const CONCURRENT_MAX_DEFAULT = 50

// ── Sequential limits ────────────────────────────────────────────────────────
/** Hard cap on the total sequential request count (all endpoints). */
export const SEQUENTIAL_MAX_DEFAULT = 2000

/** Maximum allowed inter-request delay (ms). Prevents accidental very-long tests. */
export const SEQUENTIAL_MAX_DELAY_MS = 20000

// ── Sequential minimum-delay tiers ───────────────────────────────────────────
/**
 * Each tier defines an inclusive upper bound for the request count and the
 * minimum inter-request delay that must be applied at that volume.
 *
 * Rationale: low volumes are fine with no delay; higher volumes need spacing
 * to avoid overwhelming the backend and producing meaningless test results.
 *
 * Tiers are checked in order — the first matching entry wins.
 * The final tier (maxCount: Infinity) acts as the catch-all.
 */
export const SEQ_DELAY_TIERS = [
  { maxCount: 50,       minDelay: 0   },   // 1 – 50:   no delay required
  { maxCount: 75,       minDelay: 50  },   // 51 – 75:  ≥ 50 ms
  { maxCount: 100,      minDelay: 65  },   // 76 – 100: ≥ 65 ms
  { maxCount: Infinity, minDelay: 100 },   // 101+:     ≥ 100 ms
]

/**
 * Returns the minimum required inter-request delay (ms) for the given
 * sequential request count, based on SEQ_DELAY_TIERS.
 */
export function getMinDelay(count) {
  for (const tier of SEQ_DELAY_TIERS) {
    if (count <= tier.maxCount) return tier.minDelay
  }
  return SEQ_DELAY_TIERS[SEQ_DELAY_TIERS.length - 1].minDelay
}

/** Maximum number of result rows rendered per status group in the table.
 *  e.g. up to 50 passed rows + 50 blocked rows + 50 error rows. */
export const DISPLAY_LIMIT = 50

/** Default number of requests pre-filled in the Burst panel. */
export const DEFAULT_REQUEST_COUNT = 15

/** Polling interval (ms) between visualizer state fetches during a burst. */
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
