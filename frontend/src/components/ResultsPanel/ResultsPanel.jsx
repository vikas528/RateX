/**
 * ResultsPanel.jsx
 *
 * Displays the collected burst-test results: a summary row with badges, a
 * pass-rate progress bar, and a paginated response table.
 *
 * Display strategy: up to DISPLAY_LIMIT rows are shown per status group
 * (passed, blocked-429, other errors).  The combined display list is sorted by
 * the original request number so context is preserved.
 *
 * Filtering: clicking a summary badge filters the table to that group only.
 * Clicking the active badge again resets to "all".
 */
import { useState, useRef, useEffect } from 'react'
import { DISPLAY_LIMIT, HTTP_OK, HTTP_CREATED, HTTP_429 } from '../../constants/ui'

export default function ResultsPanel({ results, onClear }) {
  // ── Filter state: null | 'pass' | 'block' | 'err' ────────────────────────
  // Hooks must always be called unconditionally (before any early return).
  const [filter, setFilter] = useState(null)
  const tableRef = useRef(null)

  // Reset filter when results change (new burst)
  useEffect(() => setFilter(null), [results])

  // Scroll table to top whenever filter changes
  useEffect(() => {
    if (tableRef.current) tableRef.current.scrollTop = 0
  }, [filter])

  if (!results.length) return null

  const toggle = (f) => setFilter(prev => prev === f ? null : f)

  // ── Stats ────────────────────────────────────────────────────────────────
  const total   = results.length
  const passed  = results.filter(r => r.status === HTTP_OK || r.status === HTTP_CREATED)
  const blocked = results.filter(r => r.status === HTTP_429)
  const errored = results.filter(r => r.status !== HTTP_OK && r.status !== HTTP_CREATED && r.status !== HTTP_429)
  const avgMs   = total ? Math.round(results.reduce((s, r) => s + r.ms, 0) / total) : 0
  const pct     = total ? Math.round((passed.length / total) * 100) : 0

  // ── Per-group capping, then filter, then merge + sort ─────────────────────
  const passedShown  = passed.slice(0, DISPLAY_LIMIT)
  const blockedShown = blocked.slice(0, DISPLAY_LIMIT)
  const erroredShown = errored.slice(0, DISPLAY_LIMIT)

  const allRows = [...passedShown, ...blockedShown, ...erroredShown].sort((a, b) => a.n - b.n)

  const displayed = filter === 'pass'  ? passedShown
                  : filter === 'block' ? blockedShown
                  : filter === 'err'   ? erroredShown
                  : allRows

  const passTrunc  = passed.length  > DISPLAY_LIMIT
  const blockTrunc = blocked.length > DISPLAY_LIMIT
  const errTrunc   = errored.length > DISPLAY_LIMIT
  const anyTrunc   = passTrunc || blockTrunc || errTrunc

  return (
    <div className="card results-card">

      {/* ── Summary row ── */}
      <div className="results-header">
        <div className="results-summary">
          <button
            className={`badge badge--pass badge--btn ${filter === 'pass' ? 'badge--active' : ''}`}
            onClick={() => toggle('pass')}
            title={filter === 'pass' ? 'Show all' : 'Show passed only'}
          >
            {passed.length.toLocaleString()} passed
            {filter === 'pass' && <span className="badge-clear">✕</span>}
          </button>

          <button
            className={`badge badge--block badge--btn ${filter === 'block' ? 'badge--active' : ''}`}
            onClick={() => toggle('block')}
            title={filter === 'block' ? 'Show all' : 'Show blocked (429) only'}
          >
            {blocked.length.toLocaleString()} blocked (429)
            {filter === 'block' && <span className="badge-clear">✕</span>}
          </button>

          {errored.length > 0 && (
            <button
              className={`badge badge--err badge--btn ${filter === 'err' ? 'badge--active' : ''}`}
              onClick={() => toggle('err')}
              title={filter === 'err' ? 'Show all' : 'Show errors only'}
            >
              {errored.length} error
              {filter === 'err' && <span className="badge-clear">✕</span>}
            </button>
          )}

          <span className="badge badge--avg">avg {avgMs}ms</span>

          <div className="prog-bar-wrap">
            <div className="prog-bar" style={{ width: pct + '%' }} />
          </div>
          <span className="prog-label">{pct}% allowed</span>
        </div>

        <button className="btn-clear" onClick={onClear} title="Clear results">
          ✕ Clear
        </button>
      </div>

      {/* ── Filter active notice ── */}
      {filter && (
        <div className="filter-notice">
          Showing <strong>{filter === 'pass' ? 'passed' : filter === 'block' ? 'blocked (429)' : 'error'}</strong> rows only
          {' '}— <button className="filter-notice-reset" onClick={() => setFilter(null)}>show all</button>
        </div>
      )}

      {/* ── Per-group truncation notice ── */}
      {anyTrunc && !filter && (
        <div className="truncation-note">
          Showing up to {DISPLAY_LIMIT} rows per status group —
          {passTrunc  && ` ${passed.length.toLocaleString()} passed`}
          {blockTrunc && ` · ${blocked.length.toLocaleString()} blocked`}
          {errTrunc   && ` · ${errored.length.toLocaleString()} errors`}
          {' '}total
        </div>
      )}

      {/* ── Response table ── */}
      <div className="results-table-wrap" ref={tableRef}>
        <table className="results-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Status</th>
              <th>Remaining</th>
              <th>Reset</th>
              <th>Latency</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map(r => {
              const ok = r.status === HTTP_OK || r.status === HTTP_CREATED
              const hasReset = r.reset !== null && r.reset !== undefined && r.reset !== ''
              const resetTs = hasReset ? Number(r.reset) : NaN
              const resetStr = Number.isFinite(resetTs) && resetTs > 0
                ? new Date(resetTs * 1000).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                : '—'
              const remainingStr = r.remaining !== null && r.remaining !== undefined && r.remaining !== ''
                ? r.remaining
                : '—'
              const rowClass = ok ? 'row--pass' : r.status === HTTP_429 ? 'row--block' : 'row--err'
              const pillClass = ok ? 'pill--ok' : r.status === HTTP_429 ? 'pill--429' : 'pill--err'

              return (
                <tr key={r.n} className={rowClass}>
                  <td className="cell-n" data-label="#">{r.n}</td>
                  <td className="cell-status" data-label="Status">
                    <span className={`status-pill ${pillClass}`}>
                      {ok ? '✓' : '✗'} {r.status}
                    </span>
                  </td>
                  <td data-label="Remaining">{remainingStr}</td>
                  <td className="cell-reset" data-label="Reset">{resetStr}</td>
                  <td className="cell-ms" data-label="Latency">{r.ms}ms</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
