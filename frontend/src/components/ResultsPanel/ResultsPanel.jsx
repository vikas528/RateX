/**
 * ResultsPanel.jsx
 *
 * Displays the collected burst-test results: a summary row with badges, a
 * pass-rate progress bar, and a paginated response table.
 */
import { DISPLAY_LIMIT, HTTP_OK, HTTP_CREATED, HTTP_429 } from '../../constants/ui'

export default function ResultsPanel({ results, onClear }) {
  if (!results.length) return null

  // ── Stats ────────────────────────────────────────────────────────────────
  const total   = results.length
  const passed  = results.filter(r => r.status === HTTP_OK || r.status === HTTP_CREATED).length
  const blocked = results.filter(r => r.status === HTTP_429).length
  const errored = total - passed - blocked
  const avgMs   = total ? Math.round(results.reduce((s, r) => s + r.ms, 0) / total) : 0
  const pct     = total ? Math.round((passed / total) * 100) : 0

  const displayed = results.slice(0, DISPLAY_LIMIT)

  return (
    <div className="card results-card">

      {/* ── Summary row ── */}
      <div className="results-header">
        <div className="results-summary">
          <span className="badge badge--pass">{passed.toLocaleString()} passed</span>
          <span className="badge badge--block">{blocked.toLocaleString()} blocked (429)</span>
          {errored > 0 && (
            <span className="badge badge--err">{errored} error</span>
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

      {/* ── Truncation notice ── */}
      {total > DISPLAY_LIMIT && (
        <div className="truncation-note">
          Showing first {DISPLAY_LIMIT} of {total.toLocaleString()} requests
        </div>
      )}

      {/* ── Response table ── */}
      <div className="results-table-wrap">
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
              const resetStr = r.reset
                ? new Date(r.reset * 1000).toLocaleTimeString()
                : '—'
              const rowClass = ok ? 'row--pass' : r.status === HTTP_429 ? 'row--block' : 'row--err'
              const pillClass = ok ? 'pill--ok' : r.status === HTTP_429 ? 'pill--429' : 'pill--err'

              return (
                <tr key={r.n} className={rowClass}>
                  <td className="cell-n">{r.n}</td>
                  <td>
                    <span className={`status-pill ${pillClass}`}>
                      {ok ? '✓' : '✗'} {r.status}
                    </span>
                  </td>
                  <td>{r.remaining ?? '—'}</td>
                  <td className="cell-reset">{resetStr}</td>
                  <td className="cell-ms">{r.ms}ms</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
