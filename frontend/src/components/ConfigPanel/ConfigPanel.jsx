/**
 * ConfigPanel.jsx
 *
 * Card that lets the user choose an algorithm and tune its parameters, then
 * POST the new config to the backend.  All state management lives in the
 * useRateLimiterConfig hook; this component is purely presentational.
 */
import { ALGO_LABELS, ALGO_DESC, ALGOS, CONFIG_BOUNDS } from '../../constants/algorithms'

export default function ConfigPanel({
  algo,       setAlgo,
  limit,      setLimit,
  windowSecs, setWindowSecs,
  refillRate, setRefillRate,
  isApplying,
  configMsg,
  configStatus,
  isDirty,
  onApply,
}) {
  if (configStatus === 'loading') {
    return (
      <div className="card">
        <h2 className="card-title">Configuration</h2>
        <div className="config-status-msg config-status-msg--loading">Connecting to backend…</div>
      </div>
    )
  }

  if (configStatus === 'error') {
    return (
      <div className="card">
        <h2 className="card-title">Configuration</h2>
        <div className="config-status-msg config-status-msg--error">
          ✗ Could not reach the backend. Check that the server is running.
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="config-panel-header">
        <h2 className="card-title" style={{ margin: 0 }}>Configuration</h2>
        {isDirty && (
          <span className="config-dirty-badge" title="You have unsaved changes — click Apply Config">
            ● unsaved
          </span>
        )}
      </div>

      {/* ── Algorithm selector ── */}
      <label className="field-label" style={{ marginTop: '1rem' }}>Algorithm</label>
      <div className="algo-grid">
        {Object.entries(ALGO_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`algo-btn ${algo === key ? 'algo-btn--active' : ''}`}
            onClick={() => setAlgo(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Numeric fields ── */}
      <div className="field-row">
        <div className="field">
          <label className="field-label">
            {algo === ALGOS.TOKEN_BUCKET ? 'Bucket Capacity' : 'Max Requests'}
            <span className="field-cap-hint">(1 – {CONFIG_BOUNDS.limit.max})</span>
          </label>
          <input
            type="number" className="input" min={CONFIG_BOUNDS.limit.min} max={CONFIG_BOUNDS.limit.max}
            value={limit}
            onChange={e => setLimit(e.target.value)}
          />
        </div>

        {algo === ALGOS.TOKEN_BUCKET ? (
          <div className="field">
            <label className="field-label">
              Refill Rate (tokens/sec)
              <span className="field-cap-hint">({CONFIG_BOUNDS.refillRate.min} – {CONFIG_BOUNDS.refillRate.max})</span>
            </label>
            <input
              type="number" className="input"
              min={CONFIG_BOUNDS.refillRate.min} max={CONFIG_BOUNDS.refillRate.max} step="0.1"
              value={refillRate}
              onChange={e => setRefillRate(e.target.value)}
            />
          </div>
        ) : (
          <div className="field">
            <label className="field-label">
              Window (seconds)
              <span className="field-cap-hint">(1 – {CONFIG_BOUNDS.windowSecs.max})</span>
            </label>
            <input
              type="number" className="input" min={CONFIG_BOUNDS.windowSecs.min} max={CONFIG_BOUNDS.windowSecs.max}
              value={windowSecs}
              onChange={e => setWindowSecs(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* ── Apply button ── */}
      <button
        className={`btn ${isDirty ? 'btn--primary' : 'btn--primary btn--primary-muted'}`}
        onClick={onApply}
        disabled={isApplying}
      >
        {isApplying ? 'Applying…' : 'Apply Config'}
      </button>

      {configMsg && (
        <div className={`config-msg ${configMsg.startsWith('✓') ? 'config-msg--ok' : 'config-msg--err'}`}>
          {configMsg}
        </div>
      )}

      {/* ── Algorithm description ── */}
      <div className="algo-info">
        <div className="algo-info-title">How it works</div>
        <p>{ALGO_DESC[algo]}</p>
      </div>
    </div>
  )
}

