/**
 * RequestGraph.jsx
 *
 * Live multi-line chart showing request outcomes over time.
 *
 * DATA SOURCE: the `results` array from useBurst — zero extra server calls.
 *
 * Visual design:
 *   • Three lines: 2xx Passed (green), 429 Blocked (red), Error (orange)
 *   • Semi-transparent area fill under each line highlights spikes clearly
 *   • Moving vertical crosshair on hover with a detailed tooltip
 *   • "LIVE" pulse badge while the burst is running
 */
import { useMemo, useState, useRef, useCallback } from 'react'
import { HTTP_OK, HTTP_CREATED, HTTP_429 } from '../../constants/ui'

// ── SVG layout constants ───────────────────────────────────────────────────
const W      = 700   // viewBox width
const H      = 150   // plot area height
const AXIS_H = 22    // x-axis label height
const AXIS_W = 38    // y-axis label width
const PLOT_W = W - AXIS_W  // actual drawable width

// ── Bucket granularity by total request count ─────────────────────────────
function bucketSize(total) {
  if (total <=  50)  return 1
  if (total <= 150)  return 5
  if (total <= 400)  return 10
  if (total <= 800)  return 25
  if (total <= 1500) return 50
  return 100
}

// ── Round up to a "nice" y-axis ceiling ───────────────────────────────────
function niceMax(raw) {
  if (raw <= 0) return 1
  const steps = [1,2,5,10,15,20,25,50,75,100,150,200,250,500,1000,2000]
  return steps.find(s => s >= raw) ?? Math.ceil(raw / 100) * 100
}

// ── Aggregate results into time-ordered buckets ───────────────────────────
function buildSeries(results) {
  if (!results.length) return { buckets: [], bSize: 1 }
  const bSize   = bucketSize(results.length)
  const buckets = []

  for (let start = 1; start <= results.length; start += bSize) {
    const end   = Math.min(start + bSize - 1, results.length)
    const slice = results.filter(r => r.n >= start && r.n <= end)
    buckets.push({
      label:   bSize === 1 ? `${start}` : `${start}–${end}`,
      pass:    slice.filter(r => r.status === HTTP_OK || r.status === HTTP_CREATED).length,
      blocked: slice.filter(r => r.status === HTTP_429).length,
      error:   slice.filter(r => r.status !== HTTP_OK && r.status !== HTTP_CREATED && r.status !== HTTP_429).length,
    })
  }
  return { buckets, bSize }
}

// ── Convert a value series to an SVG polyline points string ───────────────
function toPoints(buckets, key, yMax, n) {
  return buckets.map((b, i) => {
    const x = AXIS_W + (n <= 1 ? 0 : (i / (n - 1)) * PLOT_W)
    const y = H - (b[key] / yMax) * H
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

// ── Build a closed area path from a value series ──────────────────────────
function toAreaPath(buckets, key, yMax, n) {
  if (!n) return ''
  const pts = buckets.map((b, i) => {
    const x = AXIS_W + (n <= 1 ? 0 : (i / (n - 1)) * PLOT_W)
    const y = H - (b[key] / yMax) * H
    return [x, y]
  })
  const top    = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const firstX = pts[0][0].toFixed(1)
  const lastX  = pts[pts.length - 1][0].toFixed(1)
  return `M ${firstX},${H} L ${top} L ${lastX},${H} Z`
}

const SERIES = [
  { key: 'pass',    label: '2xx Passed',  lineVar: 'var(--status-pass-text)',  gradId: 'rg-grad-pass'  },
  { key: 'blocked', label: '429 Blocked', lineVar: 'var(--status-block-text)', gradId: 'rg-grad-block' },
  { key: 'error',   label: 'Error',       lineVar: 'var(--status-warn-text)',  gradId: 'rg-grad-error' },
]

export default function RequestGraph({ results, isBursting }) {
  const [hoverIdx, setHoverIdx] = useState(null)
  const svgRef = useRef(null)

  const { buckets } = useMemo(() => buildSeries(results), [results])
  const n = buckets.length

  const yMax = useMemo(() => {
    if (!n) return 1
    return niceMax(Math.max(1, ...buckets.map(b => Math.max(b.pass, b.blocked, b.error))))
  }, [buckets, n])

  const yTicks = [0, Math.round(yMax / 2), yMax]

  // ── Mouse tracking ─────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (!svgRef.current || n < 1) return
    const rect  = svgRef.current.getBoundingClientRect()
    const rawX  = (e.clientX - rect.left) / rect.width * W
    const plotX = rawX - AXIS_W
    if (plotX < 0 || plotX > PLOT_W) { setHoverIdx(null); return }
    setHoverIdx(Math.min(n - 1, Math.max(0, Math.round((plotX / PLOT_W) * (n - 1)))))
  }, [n])

  if (!results.length && !isBursting) return null

  const hovBucket = hoverIdx !== null ? buckets[hoverIdx] : null
  const hoverX    = hoverIdx !== null
    ? AXIS_W + (n <= 1 ? 0 : (hoverIdx / (n - 1)) * PLOT_W)
    : null

  // Show dots only when they are large enough to be meaningful
  const dotR = n <= 50 ? 2.5 : n <= 200 ? 1.5 : 0

  return (
    <div className="card rg-card">

      {/* ── Header ── */}
      <div className="rg-header">
        <h2 className="card-title" style={{ margin: 0 }}>Request Timeline</h2>

        <div className="rg-legend">
          {SERIES.map(s => (
            <span key={s.key} className="rg-legend-item">
              <span className="rg-legend-line" style={{ background: s.lineVar }} />
              {s.label}
            </span>
          ))}
        </div>

        {isBursting
          ? <span className="rg-status rg-status--live"><span className="viz-pulse" />LIVE</span>
          : results.length
            ? <span className="rg-status rg-status--done">DONE</span>
            : <span className="rg-status rg-status--waiting">WAITING</span>
        }
      </div>

      {/* ── Empty / waiting placeholder ── */}
      {!results.length && (
        <div className="rg-empty">Waiting for first responses…</div>
      )}

      {/* ── SVG chart ── */}
      {results.length > 0 && (
        <div className="rg-chart-wrap">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H + AXIS_H}`}
            className="rg-svg"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIdx(null)}
          >
            {/* ── Gradient defs for area fills ── */}
            <defs>
              {SERIES.map(s => (
                <linearGradient key={s.gradId} id={s.gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={s.lineVar} stopOpacity="0.20" />
                  <stop offset="100%" stopColor={s.lineVar} stopOpacity="0.02" />
                </linearGradient>
              ))}
            </defs>

            {/* ── Y-axis grid lines + labels ── */}
            {yTicks.map(tick => {
              const y = H - (tick / yMax) * H
              return (
                <g key={tick}>
                  <line x1={AXIS_W} y1={y} x2={W} y2={y}
                    stroke="var(--border-default)"
                    strokeWidth={tick === 0 ? 1.5 : 1}
                    strokeDasharray={tick === 0 ? undefined : '4 3'}
                  />
                  <text x={AXIS_W - 6} y={y + 4}
                    textAnchor="end" fontSize="9" fill="var(--text-dim)"
                    fontFamily="Inter,system-ui"
                  >{tick}</text>
                </g>
              )
            })}

            {/* ── Area fills (lowest layer) ── */}
            {SERIES.map(s => (
              <path key={s.key}
                d={toAreaPath(buckets, s.key, yMax, n)}
                fill={`url(#${s.gradId})`}
              />
            ))}

            {/* ── Lines ── */}
            {SERIES.map(s => (
              <polyline key={s.key}
                points={toPoints(buckets, s.key, yMax, n)}
                fill="none"
                stroke={s.lineVar}
                strokeWidth="1.8"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

            {/* ── Dots at each data point ── */}
            {dotR > 0 && SERIES.map(s =>
              buckets.map((b, i) => {
                const x = AXIS_W + (n <= 1 ? 0 : (i / (n - 1)) * PLOT_W)
                const y = H - (b[s.key] / yMax) * H
                const isHov = hoverIdx === i
                return (
                  <circle key={`${s.key}-${i}`}
                    cx={x} cy={y}
                    r={isHov ? dotR + 1.5 : dotR}
                    fill={s.lineVar}
                    stroke="var(--bg-card)"
                    strokeWidth={isHov ? 1.5 : 1}
                  />
                )
              })
            )}

            {/* ── Hover crosshair ── */}
            {hoverX !== null && (
              <line
                x1={hoverX} y1={0} x2={hoverX} y2={H}
                stroke="var(--text-dim)" strokeWidth="1"
                strokeDasharray="3 3"
              />
            )}

            {/* ── Live progress line (rightmost bucket) ── */}
            {isBursting && n > 0 && (() => {
              const x = AXIS_W + (n <= 1 ? 0 : ((n - 1) / (n - 1)) * PLOT_W)
              return (
                <line x1={x} y1={0} x2={x} y2={H}
                  stroke="var(--brand)" strokeWidth="1.5"
                  strokeDasharray="5 3" opacity={0.7}
                />
              )
            })()}

            {/* ── X-axis labels (sparse) ── */}
            {buckets.map((b, i) => {
              const step = Math.ceil(n / 10)
              if (n > 10 && i % step !== 0 && i !== n - 1) return null
              const x = AXIS_W + (n <= 1 ? 0 : (i / (n - 1)) * PLOT_W)
              return (
                <text key={i} x={x} y={H + AXIS_H - 4}
                  textAnchor="middle" fontSize="8" fill="var(--text-faint)"
                  fontFamily="monospace"
                >{b.label}</text>
              )
            })}

            {/* ── Transparent hit area over the plot ── */}
            <rect
              x={AXIS_W} y={0} width={PLOT_W} height={H}
              fill="transparent"
            />
          </svg>

          {/* ── Tooltip (fixed positioning via screen coords) ── */}
          {hovBucket && hoverX !== null && (() => {
            const rect    = svgRef.current?.getBoundingClientRect()
            if (!rect) return null
            const screenX = rect.left + (hoverX / W) * rect.width
            const screenY = rect.top
            return (
              <div
                className="rg-tooltip"
                style={{
                  position:      'fixed',
                  left:          Math.min(screenX + 14, window.innerWidth - 160),
                  top:           screenY + 10,
                  pointerEvents: 'none',
                }}
              >
                <div className="rg-tt-title">Req #{hovBucket.label}</div>
                <div className="rg-tt-row rg-tt--pass">
                  <span>✓ Passed</span><strong>{hovBucket.pass}</strong>
                </div>
                <div className="rg-tt-row rg-tt--block">
                  <span>✗ Blocked</span><strong>{hovBucket.blocked}</strong>
                </div>
                {hovBucket.error > 0 && (
                  <div className="rg-tt-row rg-tt--error">
                    <span>! Error</span><strong>{hovBucket.error}</strong>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
