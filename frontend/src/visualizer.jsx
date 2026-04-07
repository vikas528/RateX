import { useState, useEffect, useRef } from 'react'

const POLL_MS = 350

export default function Visualizer({ activeConfig }) {
  const [state, setState] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    setState(null)
    const poll = () =>
      fetch('/api/visualizer-state')
        .then(r => r.json())
        .then(setState)
        .catch(() => {})

    poll()
    timerRef.current = setInterval(poll, POLL_MS)
    return () => clearInterval(timerRef.current)
  }, [
    activeConfig?.algo,
    activeConfig?.limit,
    activeConfig?.window_seconds,
    activeConfig?.refill_rate,
  ])

  return (
    <div className="card viz-card">
      <div className="viz-header">
        <h2 className="card-title" style={{ margin: 0 }}>Live Visualizer</h2>
        <div className="viz-live-badge">
          <span className="viz-pulse" />
          LIVE
        </div>
      </div>

      {!state ? (
        <div className="viz-loading">Connecting…</div>
      ) : (
        <>
          {state.algo === 'token_bucket'   && <TokenBucketViz   state={state} />}
          {state.algo === 'fixed_window'   && <FixedWindowViz   state={state} />}
          {state.algo === 'sliding_window' && <SlidingWindowViz state={state} />}
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Token Bucket
// ─────────────────────────────────────────────────────────────────────────────
function TokenBucketViz({ state }) {
  const pct      = Math.max(0, Math.min(100, state.percent_full ?? 0))
  const tokens   = state.tokens ?? 0
  const capacity = state.capacity ?? 1
  const rate     = state.refill_rate ?? 1
  const timeToFull = rate > 0 && tokens < capacity
    ? ((capacity - tokens) / rate).toFixed(1) + 's'
    : pct >= 100 ? 'Full' : '—'

  // colour ramp: green → amber → red
  const color   = pct > 60 ? '#4ade80' : pct > 30 ? '#fb923c' : '#f87171'
  const colorBg = pct > 60 ? '#14532d22' : pct > 30 ? '#7c2d1222' : '#7f1d1d22'

  return (
    <div className="viz-tb-wrap">
      {/* ─ Bucket ─ */}
      <div className="viz-tb-left">
        <div className="viz-tb-bucket">
          {/* graduated marks */}
          {[75, 50, 25].map(t => (
            <div key={t} className="viz-tick" style={{ bottom: t + '%' }}>
              <span className="viz-tick-lbl">{Math.round(capacity * t / 100)}</span>
            </div>
          ))}
          {/* cap label */}
          <div className="viz-tick viz-tick--top">
            <span className="viz-tick-lbl">{capacity}</span>
          </div>

          {/* liquid fill */}
          <div
            className="viz-tb-liquid"
            style={{
              height: pct + '%',
              background: `linear-gradient(180deg, ${color}44 0%, ${color}22 100%)`,
              borderTop: `2px solid ${color}`,
              transition: 'height 0.35s ease, border-color 0.35s, background 0.35s',
            }}
          >
            {/* wave */}
            <div className="viz-wave" style={{ '--wc': color }} />
          </div>

          {/* token count overlay */}
          <div className="viz-tb-overlay">
            <span className="viz-tb-num" style={{ color }}>{tokens.toFixed(1)}</span>
            <span className="viz-tb-den">/{capacity}</span>
          </div>
        </div>

        {/* refill drops animation */}
        <div className="viz-drops">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="viz-drop"
              style={{ animationDuration: `${(1 / Math.max(0.1, rate) * 1200).toFixed(0)}ms`, animationDelay: `${i * 300}ms` }}
            />
          ))}
        </div>
        <div className="viz-drops-label">{rate} t/s</div>
      </div>

      {/* ─ Stats ─ */}
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

        {/* fill bar */}
        <div className="viz-stat-bar-card">
          <div className="viz-bar-hdr">
            <span>Bucket level</span>
            <span style={{ color }}>{pct.toFixed(0)}%</span>
          </div>
          <div className="viz-bar-track">
            <div
              className="viz-bar-fill"
              style={{ width: pct + '%', background: `linear-gradient(90deg, ${color}aa, ${color})`, transition: 'width 0.35s ease' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Fixed Window
// ─────────────────────────────────────────────────────────────────────────────
function FixedWindowViz({ state }) {
  // Re-render at ~10fps for smooth countdown
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick(t => t + 1), 100)
    return () => clearInterval(id)
  }, [])

  const count    = state.count     ?? 0
  const limit    = state.limit     ?? 1
  const ttlMs    = state.ttl_ms    ?? 0
  const windowMs = state.window_ms ?? 60000

  const usedPct   = Math.min(100, (count / limit) * 100)
  const timePct   = Math.max(0, Math.min(100, ((windowMs - ttlMs) / windowMs) * 100))
  const ttlSec    = (ttlMs / 1000).toFixed(1)
  const color     = usedPct > 80 ? '#f87171' : usedPct > 55 ? '#fb923c' : '#4ade80'
  const colorBg   = usedPct > 80 ? '#7f1d1d22' : usedPct > 55 ? '#7c2d1222' : '#14532d22'

  // SVG arc constants
  const R  = 52
  const CX = 64, CY = 64
  const C  = 2 * Math.PI * R
  const Ri = 36          // inner ring radius
  const Ci = 2 * Math.PI * Ri

  const timeOffset  = C  * (1 - timePct  / 100)
  const countOffset = Ci * (1 - usedPct  / 100)

  return (
    <div className="viz-fw-wrap">
      {/* ─ Ring ─ */}
      <div className="viz-fw-left">
        <svg className="viz-fw-svg" viewBox="0 0 128 128">
          {/* outer track — time elapsed */}
          <circle cx={CX} cy={CY} r={R}  fill="none" stroke="#2d3148" strokeWidth="10" />
          <circle cx={CX} cy={CY} r={R}  fill="none" stroke="#7c6bf8" strokeWidth="10"
            strokeDasharray={C}
            strokeDashoffset={timeOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${CX} ${CY})`}
            style={{ transition: 'stroke-dashoffset 0.4s linear' }}
          />

          {/* inner ring — request count */}
          <circle cx={CX} cy={CY} r={Ri} fill="none" stroke="#2d3148" strokeWidth="8" />
          <circle cx={CX} cy={CY} r={Ri} fill="none" stroke={color}   strokeWidth="8"
            strokeDasharray={Ci}
            strokeDashoffset={countOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${CX} ${CY})`}
            style={{ transition: 'stroke-dashoffset 0.35s ease, stroke 0.35s' }}
          />

          {/* centre text */}
          <text x={CX} y={CY - 8} textAnchor="middle" fill={color}   fontSize="22" fontWeight="700" fontFamily="Inter,system-ui">{count}</text>
          <text x={CX} y={CY + 8} textAnchor="middle" fill="#5a6282"  fontSize="11" fontFamily="Inter,system-ui">used</text>
          <text x={CX} y={CY + 20} textAnchor="middle" fill="#3d4468" fontSize="10" fontFamily="Inter,system-ui">/ {limit}</text>
        </svg>

        <div className="viz-fw-ring-legend">
          <span className="viz-legend-dot" style={{ background: '#7c6bf8' }} /> time elapsed
          &nbsp;&nbsp;
          <span className="viz-legend-dot" style={{ background: color }} /> requests used
        </div>
      </div>

      {/* ─ Stats ─ */}
      <div className="viz-fw-right">
        <div className="viz-stats-grid viz-stats-grid--2col">
          <StatCard label="Requests Used" color={color} bg={colorBg}>
            <span style={{ color, fontSize: '1.5rem', fontWeight: 700 }}>{count}</span>
            <span className="viz-stat-sub"> / {limit}</span>
          </StatCard>
          <StatCard label="Remaining">
            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Math.max(0, limit - count)}</span>
          </StatCard>
          <StatCard label="Resets In" color="#a78bfa" bg="#2d276022">
            <span style={{ color: '#a78bfa', fontSize: '1.5rem', fontWeight: 700 }}>{ttlSec}</span>
            <span className="viz-stat-sub">s</span>
          </StatCard>
          <StatCard label="Window Size">
            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{windowMs / 1000}</span>
            <span className="viz-stat-sub">s</span>
          </StatCard>
        </div>

        {/* request fill bar */}
        <div className="viz-stat-bar-card" style={{ marginTop: '.75rem' }}>
          <div className="viz-bar-hdr">
            <span>Request fill</span><span style={{ color }}>{usedPct.toFixed(0)}%</span>
          </div>
          <div className="viz-bar-track">
            <div className="viz-bar-fill"
              style={{ width: usedPct + '%', background: `linear-gradient(90deg, ${color}aa, ${color})`, transition: 'width 0.35s ease' }}
            />
          </div>
        </div>

        {/* time bar */}
        <div className="viz-stat-bar-card" style={{ marginTop: '.6rem' }}>
          <div className="viz-bar-hdr">
            <span>Window elapsed</span><span style={{ color: '#a78bfa' }}>{timePct.toFixed(0)}%</span>
          </div>
          <div className="viz-bar-track">
            <div className="viz-bar-fill"
              style={{ width: timePct + '%', background: 'linear-gradient(90deg, #7c6bf8aa, #7c6bf8)', transition: 'width 0.4s linear' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sliding Window
// ─────────────────────────────────────────────────────────────────────────────
function SlidingWindowViz({ state }) {
  // Animate bars sliding left at ~10fps
  // Instead of JS animation, we re-poll at POLL_MS — bars naturally slide left
  // because ages increase each frame. Smooth enough at 350ms poll.

  const count      = state.count          ?? 0
  const limit      = state.limit          ?? 1
  const windowSecs = state.window_seconds ?? 60
  const ages       = state.request_ages_ms ?? []
  const usedPct    = Math.min(100, (count / limit) * 100)
  const color      = usedPct > 80 ? '#f87171' : usedPct > 55 ? '#fb923c' : '#4ade80'
  const colorBg    = usedPct > 80 ? '#7f1d1d22' : usedPct > 55 ? '#7c2d1222' : '#14532d22'

  const W = 700, H = 80
  const windowMs = windowSecs * 1000
  const BAR_W = 3

  // Compute bar x positions (right = now = W, left = oldest = 0)
  // Merge/stack bars closer than 5px
  const bars = []
  let lastX = -99
  // ages come in descending order (most recent first from ZRevRangeByScore)
  // Sort ascending for left-to-right rendering
  const sorted = [...ages].sort((a, b) => b - a) // oldest first
  for (const ageMs of sorted) {
    const x = Math.round(W - (ageMs / windowMs) * W)
    if (x < 0 || x > W) continue
    if (x - lastX < BAR_W + 2) {
      if (bars.length) bars[bars.length - 1].h = Math.min(bars[bars.length - 1].h + 5, H - 10)
    } else {
      bars.push({ x, h: 16 })
      lastX = x
    }
  }

  // Time axis labels every 10s (or 5s for small windows)
  const step = windowSecs <= 30 ? 5 : windowSecs <= 120 ? 10 : 30
  const ticks = []
  for (let s = step; s < windowSecs; s += step) {
    ticks.push(s)
  }

  return (
    <div className="viz-sw-wrap">
      {/* ─ Header row ─ */}
      <div className="viz-sw-header">
        <div className="viz-sw-count">
          <span style={{ color, fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>{count}</span>
          <span style={{ color: '#5a6282', fontSize: '1rem' }}> / {limit} requests</span>
          <span style={{ color: '#3d4468', fontSize: '.85rem' }}> in last {windowSecs}s</span>
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

      {/* ─ Timeline SVG ─ */}
      <div className="viz-sw-timeline-wrap">
        <svg className="viz-sw-svg" viewBox={`0 0 ${W} ${H + 20}`} preserveAspectRatio="none">
          {/* Background */}
          <rect x="0" y="0" width={W} height={H} fill="#0d1018" rx="6" />

          {/* Grid lines at every tick */}
          {ticks.map(s => {
            const x = W - (s / windowSecs) * W
            return (
              <g key={s}>
                <line x1={x} y1="0" x2={x} y2={H} stroke="#1e2538" strokeWidth="1" />
                <text x={x} y={H + 15} textAnchor="middle" fill="#3d4468" fontSize="9" fontFamily="monospace">
                  -{s}s
                </text>
              </g>
            )
          })}

          {/* Request bars */}
          {bars.map((b, i) => (
            <rect
              key={i}
              x={b.x - BAR_W / 2}
              y={H - b.h - 2}
              width={BAR_W}
              height={b.h}
              rx="1"
              fill={color}
              opacity={0.75 + 0.25 * (b.x / W)}  // newer = more opaque
            />
          ))}

          {/* "Now" line */}
          <line x1={W - 1} y1="0" x2={W - 1} y2={H} stroke="#7c6bf8" strokeWidth="2" />
          <text x={W - 4} y="14" textAnchor="end" fill="#7c6bf8" fontSize="10" fontFamily="monospace">now</text>

          {/* Left edge label */}
          <text x="4" y="14" fill="#3d4468" fontSize="10" fontFamily="monospace">-{windowSecs}s</text>
        </svg>
      </div>

      {/* ─ Fill bar ─ */}
      <div className="viz-stat-bar-card" style={{ marginTop: '.75rem' }}>
        <div className="viz-bar-hdr">
          <span>Window fill</span>
          <span style={{ color }}>{usedPct.toFixed(0)}%</span>
        </div>
        <div className="viz-bar-track">
          <div
            className="viz-bar-fill"
            style={{ width: usedPct + '%', background: `linear-gradient(90deg, ${color}88, ${color})`, transition: 'width 0.35s ease' }}
          />
        </div>
      </div>

      <div className="viz-sw-legend">
        <span className="viz-legend-dot" style={{ background: color }} />
        each bar = 1 request &nbsp;·&nbsp;
        bars stack when dense &nbsp;·&nbsp;
        older bars fade &nbsp;·&nbsp;
        <span style={{ color: '#7c6bf8' }}>│</span> = now
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared stat card
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ label, color, bg, children }) {
  return (
    <div
      className="viz-stat-card"
      style={color ? { borderColor: color, background: bg || 'transparent' } : {}}
    >
      <div className="viz-stat-label">{label}</div>
      <div className="viz-stat-value">{children}</div>
    </div>
  )
}
