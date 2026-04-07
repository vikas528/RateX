/**
 * SlidingWindowViz.jsx
 *
 * Timeline SVG visualisation for the Sliding Window rate-limiter.
 * Each request appears as a vertical bar; bars naturally slide left as their
 * age increases between polls.
 */
import StatCard from './StatCard'
import { usageColor, usageBg, usageGradient } from './colorHelpers'

// SVG timeline dimensions
const SVG_W  = 700
const SVG_H  = 80
const BAR_W  = 3

export default function SlidingWindowViz({ state }) {
  const count       = state.count           ?? 0
  const limit       = state.limit           ?? 1
  const windowSecs  = state.window_seconds  ?? 60
  const ages        = state.request_ages_ms ?? []

  const usedPct = Math.min(100, (count / limit) * 100)
  const color   = usageColor(usedPct)
  const colorBg = usageBg(usedPct)

  // ── Build bar positions ──────────────────────────────────────────────────
  const windowMs = windowSecs * 1000
  const bars = []
  let lastX = -99
  // Ages come newest-first from backend; sort oldest-first for left-to-right render
  const sorted = [...ages].sort((a, b) => b - a)
  for (const ageMs of sorted) {
    const x = Math.round(SVG_W - (ageMs / windowMs) * SVG_W)
    if (x < 0 || x > SVG_W) continue
    if (x - lastX < BAR_W + 2) {
      if (bars.length) bars[bars.length - 1].h = Math.min(bars[bars.length - 1].h + 5, SVG_H - 10)
    } else {
      bars.push({ x, h: 16 })
      lastX = x
    }
  }

  // ── Time-axis tick marks ─────────────────────────────────────────────────
  const tickStep = windowSecs <= 30 ? 5 : windowSecs <= 120 ? 10 : 30
  const ticks = []
  for (let s = tickStep; s < windowSecs; s += tickStep) ticks.push(s)

  return (
    <div className="viz-sw-wrap">
      {/* ─ Header row ── */}
      <div className="viz-sw-header">
        <div className="viz-sw-count">
          <span style={{ color, fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>{count}</span>
          <span style={{ color: 'var(--text-dim)',   fontSize: '1rem' }}> / {limit} requests</span>
          <span style={{ color: 'var(--text-faint)', fontSize: '.85rem' }}> in last {windowSecs}s</span>
        </div>

        <div className="viz-stats-grid viz-stats-grid--row">
          <StatCard label="Fill" color={color} bg={colorBg}>
            <span style={{ color, fontSize: '1.3rem', fontWeight: 700 }}>{usedPct.toFixed(0)}%</span>
          </StatCard>
          <StatCard label="Remaining">
            <span style={{ fontSize: '1.3rem', fontWeight: 700 }}>{Math.max(0, limit - count)}</span>
          </StatCard>
        </div>
      </div>

      {/* ─ Timeline SVG ── */}
      <div className="viz-sw-timeline-wrap">
        <svg className="viz-sw-svg" viewBox={`0 0 ${SVG_W} ${SVG_H + 20}`} preserveAspectRatio="none">
          {/* Background */}
          <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="var(--bg-bucket)" rx="6" />

          {/* Grid lines at every tick */}
          {ticks.map(s => {
            const x = SVG_W - (s / windowSecs) * SVG_W
            return (
              <g key={s}>
                <line x1={x} y1="0" x2={x} y2={SVG_H} stroke="var(--border-default)" strokeWidth="1" />
                <text x={x} y={SVG_H + 15} textAnchor="middle" fill="var(--text-faint)" fontSize="9" fontFamily="monospace">
                  -{s}s
                </text>
              </g>
            )
          })}

          {/* Request bars — newer = more opaque */}
          {bars.map((b, i) => (
            <rect
              key={i}
              x={b.x - BAR_W / 2}
              y={SVG_H - b.h - 2}
              width={BAR_W}
              height={b.h}
              rx="1"
              fill={color}
              opacity={0.75 + 0.25 * (b.x / SVG_W)}
            />
          ))}

          {/* "Now" marker line */}
          <line x1={SVG_W - 1} y1="0" x2={SVG_W - 1} y2={SVG_H} stroke="var(--brand)" strokeWidth="2" />
          <text x={SVG_W - 4} y="14" textAnchor="end" fill="var(--brand)"      fontSize="10" fontFamily="monospace">now</text>

          {/* Left-edge label */}
          <text x="4" y="14" fill="var(--text-faint)" fontSize="10" fontFamily="monospace">-{windowSecs}s</text>
        </svg>
      </div>

      {/* ─ Fill bar ── */}
      <div className="viz-stat-bar-card" style={{ marginTop: '.75rem' }}>
        <div className="viz-bar-hdr">
          <span>Window fill</span>
          <span style={{ color }}>{usedPct.toFixed(0)}%</span>
        </div>
        <div className="viz-bar-track">
          <div
            className="viz-bar-fill"
            style={{ width: usedPct + '%', background: usageGradient(usedPct), transition: 'width 0.35s ease' }}
          />
        </div>
      </div>

      {/* ─ Legend ── */}
      <div className="viz-sw-legend">
        <span className="viz-legend-dot" style={{ background: color }} />
        each bar = 1 request &nbsp;·&nbsp;
        bars stack when dense &nbsp;·&nbsp;
        older bars fade &nbsp;·&nbsp;
        <span style={{ color: 'var(--brand)' }}>│</span> = now
      </div>
    </div>
  )
}
