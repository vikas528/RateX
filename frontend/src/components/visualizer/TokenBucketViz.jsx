/**
 * TokenBucketViz.jsx
 *
 * Animated bucket visualisation for the Token Bucket rate-limiter.
 * Colours are driven by CSS variables (via colorHelpers) so both themes work.
 */
import StatCard from './StatCard'
import { levelColor, levelColorAlpha, levelBg, levelGradient } from './colorHelpers'

export default function TokenBucketViz({ state }) {
  const pct      = Math.max(0, Math.min(100, state.percent_full ?? 0))
  const tokens   = state.tokens   ?? 0
  const capacity = state.capacity ?? 1
  const rate     = state.refill_rate ?? 1

  const timeToFull = rate > 0 && tokens < capacity
    ? ((capacity - tokens) / rate).toFixed(1) + 's'
    : pct >= 100 ? 'Full' : '—'

  const color   = levelColor(pct)
  const colorBg = levelBg(pct)

  return (
    <div className="viz-tb-wrap">
      {/* ─ Bucket ── */}
      <div className="viz-tb-left">
        <div className="viz-tb-bucket">

          {/* Graduated tick marks */}
          {[75, 50, 25].map(t => (
            <div key={t} className="viz-tick" style={{ bottom: t + '%' }}>
              <span className="viz-tick-lbl">{Math.round(capacity * t / 100)}</span>
            </div>
          ))}
          <div className="viz-tick viz-tick--top">
            <span className="viz-tick-lbl">{capacity}</span>
          </div>

          {/* Liquid fill */}
          <div
            className="viz-tb-liquid"
            style={{
              height:     pct + '%',
              background: `linear-gradient(180deg, ${levelColorAlpha(pct)} 0%, var(--bg-bucket) 100%)`,
              borderTop:  `2px solid ${color}`,
              transition: 'height 0.35s ease, border-color 0.35s, background 0.35s',
            }}
          >
            {/* Wave — colour driven by the CSS custom property --wc */}
            <div className="viz-wave" style={{ '--wc': color }} />
          </div>

          {/* Token count overlay */}
          <div className="viz-tb-overlay">
            <span className="viz-tb-num" style={{ color }}>{tokens.toFixed(1)}</span>
            <span className="viz-tb-den">/{capacity}</span>
          </div>
        </div>

        {/* Refill drop animation — speed reflects the refill rate */}
        <div className="viz-drops">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="viz-drop"
              style={{
                animationDuration: `${(1 / Math.max(0.1, rate) * 1200).toFixed(0)}ms`,
                animationDelay:    `${i * 300}ms`,
              }}
            />
          ))}
        </div>
        <div className="viz-drops-label">{rate} t/s</div>
      </div>

      {/* ─ Stat cards ── */}
      <div className="viz-stats-grid">
        <StatCard label="Tokens" color={color} bg={colorBg}>
          <span style={{ color, fontSize: '1.5rem', fontWeight: 700 }}>{tokens.toFixed(2)}</span>
          <span className="viz-stat-sub"> / {capacity}</span>
        </StatCard>

        <StatCard label="Fill Level" color={color} bg={colorBg}>
          <span style={{ color, fontSize: '1.5rem', fontWeight: 700 }}>{pct.toFixed(1)}%</span>
        </StatCard>

        <StatCard label="Refill Rate">
          <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>{rate}</span>
          <span className="viz-stat-sub"> tokens/s</span>
        </StatCard>

        <StatCard label="Time to Full">
          <span style={{ fontSize: '1.3rem', fontWeight: 700 }}>{timeToFull}</span>
        </StatCard>

        {/* Bucket level bar */}
        <div className="viz-stat-bar-card">
          <div className="viz-bar-hdr">
            <span>Bucket level</span>
            <span style={{ color }}>{pct.toFixed(0)}%</span>
          </div>
          <div className="viz-bar-track">
            <div
              className="viz-bar-fill"
              style={{ width: pct + '%', background: levelGradient(pct), transition: 'width 0.35s ease' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
