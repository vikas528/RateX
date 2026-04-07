/**
 * colorHelpers.js
 *
 * Two separate colour scales, both driven by CSS variables:
 *
 *  levelColor(pct)  — high % is GOOD (green). Used by Token Bucket where
 *                     a full bucket means plenty of capacity.
 *
 *  usageColor(pct)  — high % is BAD (red). Used by Fixed Window and Sliding
 *                     Window where high fill means you are close to the limit.
 */

// ── Token-Bucket scale: high = green (lots of tokens = healthy) ──────────────

/** Primary text colour for a token-level percentage. */
export function levelColor(pct) {
  if (pct > 60) return 'var(--status-pass-text)'
  if (pct > 30) return 'var(--status-warn-text)'
  return 'var(--status-block-text)'
}

export function levelColorAlpha(pct) {
  if (pct > 60) return 'var(--status-pass-alpha)'
  if (pct > 30) return 'var(--status-warn-alpha)'
  return 'var(--status-block-alpha)'
}

export function levelBg(pct) {
  if (pct > 60) return 'var(--viz-pass-bg)'
  if (pct > 30) return 'var(--viz-warn-bg)'
  return 'var(--viz-block-bg)'
}

export function levelGradient(pct, direction = '90deg') {
  return `linear-gradient(${direction}, ${levelColorAlpha(pct)}, ${levelColor(pct)})`
}

// ── Fixed / Sliding Window scale: high = red (fully used = bad) ──────────────

/** Primary text colour for a usage percentage (0 % used = green, 100 % = red). */
export function usageColor(pct) {
  if (pct < 40) return 'var(--status-pass-text)'
  if (pct < 75) return 'var(--status-warn-text)'
  return 'var(--status-block-text)'
}

export function usageColorAlpha(pct) {
  if (pct < 40) return 'var(--status-pass-alpha)'
  if (pct < 75) return 'var(--status-warn-alpha)'
  return 'var(--status-block-alpha)'
}

export function usageBg(pct) {
  if (pct < 40) return 'var(--viz-pass-bg)'
  if (pct < 75) return 'var(--viz-warn-bg)'
  return 'var(--viz-block-bg)'
}

export function usageGradient(pct, direction = '90deg') {
  return `linear-gradient(${direction}, ${usageColorAlpha(pct)}, ${usageColor(pct)})`
}

// ── Legacy aliases kept so nothing else breaks ────────────────────────────────
/** @deprecated use usageColor / levelColor depending on context */
export const statusColor      = usageColor
export const statusColorAlpha = usageColorAlpha
export const statusBg         = usageBg
export const statusGradient   = usageGradient
