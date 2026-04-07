/**
 * StatCard.jsx
 *
 * Small metric tile used inside every visualizer view.
 * Accepts optional `color` and `bg` CSS variable strings (e.g. from
 * colorHelpers.js) to highlight the card border and background.
 */
export default function StatCard({ label, color, bg, children }) {
  const style = color
    ? { borderColor: color, background: bg || 'transparent' }
    : {}

  return (
    <div className="viz-stat-card" style={style}>
      <div className="viz-stat-label">{label}</div>
      <div className="viz-stat-value">{children}</div>
    </div>
  )
}
