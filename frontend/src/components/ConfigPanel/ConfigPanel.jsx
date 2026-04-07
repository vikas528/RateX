/**
 * ConfigPanel.jsx
 *
 * Card that lets the user choose an algorithm and tune its parameters, then
 * POST the new config to the backend.  All state management lives in the
 * useRateLimiterConfig hook; this component is purely presentational.
 */
import { ALGO_LABELS, ALGO_DESC, ALGOS } from '../../constants/algorithms'

export default function ConfigPanel({
  algo,       setAlgo,
  limit,      setLimit,
  windowSecs, setWindowSecs,
  refillRate, setRefillRate,
  isApplying,
  configMsg,
  onApply,
}) {
  return (
    <div className="card">
      <h2 className="card-title">Configuration</h2>

      {/* ── Algorithm selector ── */}
      <label className="field-label">Algorithm</label>
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
          </label>
          <input
            type="number" className="input" min="1" max="100000"
            value={limit}
            onChange={e => setLimit(e.target.value)}
          />
        </div>

        {algo === ALGOS.TOKEN_BUCKET ? (
          <div className="field">
            <label className="field-label">Refill Rate (tokens/sec)</label>
            <input
              type="number" className="input" min="0.01" max="10000" step="0.1"
              value={refillRate}
              onChange={e => setRefillRate(e.target.value)}
            />
          </div>
        ) : (
          <div className="field">
            <label className="field-label">Window (seconds)</label>
            <input
              type="number" className="input" min="1" max="3600"
              value={windowSecs}
              onChange={e => setWindowSecs(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* ── Apply button ── */}
      <button
        className="btn btn--primary"
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
