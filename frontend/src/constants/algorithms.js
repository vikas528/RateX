/**
 * algorithms.js — Rate-limiter algorithm metadata used throughout the UI.
 *
 * Centralised here so the Config panel, the header pill, and any future
 * component all read from one source of truth.
 */

/** Human-readable display names keyed by algorithm identifier. */
export const ALGO_LABELS = {
  sliding_window: 'Sliding Window',
  fixed_window:   'Fixed Window',
  token_bucket:   'Token Bucket',
}

/** Short description shown in the "How it works" box. */
export const ALGO_DESC = {
  fixed_window:
    'Counts requests in a fixed time bucket. Resets sharply at the boundary — ' +
    'can allow 2× the limit across a window edge.',
  sliding_window:
    'Uses a rolling time window (sorted-set in Redis). No boundary spikes — ' +
    'the smoothest and fairest of the three.',
  token_bucket:
    'Fills a bucket at a configurable refill rate. Allows short bursts up to ' +
    'capacity, then enforces a steady rate.',
}

/** Canonical algorithm identifier strings — mirror backend constants/errors.go. */
export const ALGOS = {
  FIXED_WINDOW:   'fixed_window',
  SLIDING_WINDOW: 'sliding_window',
  TOKEN_BUCKET:   'token_bucket',
}

/** Default algorithm shown before the backend config is loaded. */
export const DEFAULT_ALGO = ALGOS.SLIDING_WINDOW
