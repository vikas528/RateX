/**
 * FixedWindowViz.jsx
 *
 * Dual-ring SVG visualisation for the Fixed Window rate-limiter.
 * Outer ring = time elapsed in the window.
 * Inner ring = requests used vs limit.
 */
import { useState, useEffect } from 'react'
import StatCard from './StatCard'
import { usageColor, usageBg, usageGradient } from './colorHelpers'

// SVG ring constants
const CX = 64, CY = 64
const R_OUTER = 52
const R_INNER = 36
const C_OUTER = 2 * Math.PI * R_OUTER
const C_INNER = 2 * Math.PI * R_INNER

export default function FixedWindowViz({ state }) {
  // Re-render at ~10fps for smooth TTL countdown
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick(t => t + 1), 100)
    return () => clearInterval(id)
  }, [])

  const count    = state.count     ?? 0
  const limit    = state.limit     ?? 1
  const ttlMs    = state.ttl_ms    ?? 0
  const windowMs = state.window_ms ?? 60000

  const usedPct  = Math.min(100, (count / limit) * 100)
  const timePct  = Math.max(0, Math.min(100, ((windowMs - ttlMs) / windowMs) * 100))
  const ttlSec   = (ttlMs / 1000).toFixed(1)

  const color   = usageColor(usedPct)
  const colorBg = usageBg(usedPct)

  const outerOffset = C_OUTER * (1 - timePct  / 100)
  const innerOffset = C_INNER * (1 - usedPct  / 100)

  return (
    <div className="viz-fw-wrap">
      {/* ─ Ring ── */}
      <div className="viz-fw-left">
        <svg className="viz-fw-svg" viewBox="0 0 128 128">
          {/* Outer track — time elapsed */}
          <circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="var(--border-default)" strokeWidth="10" />
          <circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="var(--brand)" strokeWidth="10"
            strokeDasharray={C_OUTER}
            strokeDashoffset={outerOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${CX} ${CY})`}
            style={{ transition: 'stroke-dashoffset 0.4s linear' }}
          />

          {/* Inner ring — request count */}
          <circle cx={CX} cy={CY} r={R_INNER} fill="none" stroke="var(--border-default)" strokeWidth="8" />
          <circle cx={CX} cy={CY} r={R_INNER} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={C_INNER}
            strokeDashoffset={innerOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${CX} ${CY})`}
            style={{ transition: 'stroke-dashoffset 0.35s ease, stroke 0.35s' }}
          />

          {/* Centre text */}
          <text x={CX} y={CY - 8}  textAnchor="middle" fill={color}              fontSize="22" fontWeight="700" fontFamily="Inter,system-ui">{count}</text>
          <text x={CX} y={CY + 8}  textAnchor="middle" fill="var(--text-dim)"    fontSize="11" fontFamily="Inter,system-ui">used</text>
          <text x={CX} y={CY + 20} textAnchor="middle" fill="var(--text-faint)"  fontSize="10" fontFamily="Inter,system-ui">/ {limit}</text>
        </svg>

        <div className="viz-fw-ring-legend">
          <span className="viz-legend-dot" style={{ background: 'var(--brand)' }} /> time elapsed
          &nbsp;&nbsp;
          <span className="viz-legend-dot" style={{ background: color }} /> requests used
        </div>
      </div>

      {/* ─ Stats ── */}
      <div className="viz-fw-right">
        <div className="viz-stats-grid viz-stats-grid--2col">
          <StatCard label="Requests Used" color={color} bg={colorBg}>
            <span style={{ color, fontSize: '1.5rem', fontWeight: 700 }}>{count}</span>
            <span className="viz-stat-sub"> / {limit}</span>
          </StatCard>

          <StatCard label="Remaining">
            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Math.max(0, limit - count)}</span>
          </StatCard>

          <StatCard label="Resets In" color="var(--brand-light)" bg="var(--brand-active-bg)">
            <span style={{ color: 'var(--brand-light)', fontSize: '1.5rem', fontWeight: 700 }}>{ttlSec}</span>
            <span className="viz-stat-sub">s</span>
          </StatCard>

          <StatCard label="Window Size">
            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{windowMs / 1000}</span>
            <span className="viz-stat-sub">s</span>
          </StatCard>
        </div>

        {/* Request fill bar */}
        <div className="viz-stat-bar-card" style={{ marginTop: '.75rem' }}>
          <div className="viz-bar-hdr">
            <span>Request fill</span>
            <span style={{ color }}>{usedPct.toFixed(0)}%</span>
          </div>
          <div className="viz-bar-track">
            <div className="viz-bar-fill"
              style={{ width: usedPct + '%', background: usageGradient(usedPct), transition: 'width 0.35s ease' }}
            />
          </div>
        </div>

        {/* Time elapsed bar */}
        <div className="viz-stat-bar-card" style={{ marginTop: '.6rem' }}>
          <div className="viz-bar-hdr">
            <span>Window elapsed</span>
            <span style={{ color: 'var(--brand-light)' }}>{timePct.toFixed(0)}%</span>
          </div>
          <div className="viz-bar-track">
            <div className="viz-bar-fill"
              style={{
                width:      timePct + '%',
                background: 'linear-gradient(90deg, var(--brand-alpha), var(--brand))',
                transition: 'width 0.4s linear',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
