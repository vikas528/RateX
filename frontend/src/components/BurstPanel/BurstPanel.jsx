/**
 * BurstPanel.jsx
 *
 * Card that lets the user configure and fire a burst of HTTP requests.
 * Uses the useBurst hook for state; receives the selected endpoint as a
 * prop so the parent (App) can wire it to a piece of its own state.
 */
import { BURST_ENDPOINTS } from '../../constants/api'
import {
  BURST_PRESETS_SEQUENTIAL,
  BURST_PRESETS_CONCURRENT,
} from '../../constants/ui'

export default function BurstPanel({
  // burst hook state
  numReqs,
  numReqsRaw,
  mode,
  delayMs,
  isBursting,
  progress,
  minDelayRequired,
  effectiveDelay,
  // burst hook actions
  setMode,
  setDelayMs,
  setNumReqs,
  handleNumReqsChange,
  onRunBurst,
  onStopBurst,
  // endpoint state (lives in App)
  endpoint,
  setEndpoint,
}) {
  const maxForMode   = mode === 'concurrent' ? endpoint.maxConcurrent : endpoint.maxSequential
  const presets      = mode === 'concurrent' ? BURST_PRESETS_CONCURRENT : BURST_PRESETS_SEQUENTIAL
  const overCap      = numReqs > maxForMode
  const delayAutoUp  = mode === 'sequential' && minDelayRequired > 0 && delayMs < minDelayRequired

  // Auto-clamp when switching mode (concurrent/sequential have different caps)
  const handleModeChange = (m) => {
    setMode(m)
    const cap = m === 'concurrent' ? endpoint.maxConcurrent : endpoint.maxSequential
    if (numReqs > cap) setNumReqs(cap)
  }

  return (
    <div className="card">
      <h2 className="card-title">Burst Test</h2>

      {/* ── Target endpoint ── */}
      <label className="field-label">Target Endpoint</label>
      <select
        className="input"
        value={endpoint.url}
        onChange={e => setEndpoint(BURST_ENDPOINTS.find(ep => ep.url === e.target.value))}
      >
        {BURST_ENDPOINTS.map(ep => (
          <option key={ep.url} value={ep.url}>{ep.label}</option>
        ))}
      </select>

      {/* ── Request count ── */}
      <div style={{ marginTop: '1.2rem' }}>
        <label className="field-label">
          Number of Requests
          <span className="field-cap-hint">
            {mode === 'concurrent'
              ? `(max ${endpoint.maxConcurrent} concurrent)`
              : `(max ${endpoint.maxSequential.toLocaleString()} sequential)`}
          </span>
        </label>
        <div className="req-count-row">
          <input
            type="number"
            className={`input req-count-input ${overCap ? 'input--warn' : ''}`}
            min="1"
            max={maxForMode}
            value={numReqsRaw}
            onChange={e => handleNumReqsChange(e.target.value)}
          />
          <div className="preset-chips">
            {presets.map(p => (
              <button
                key={p}
                className={`chip ${numReqs === p ? 'chip--active' : ''} ${p > maxForMode ? 'chip--disabled' : ''}`}
                onClick={() => setNumReqs(Math.min(p, maxForMode))}
                disabled={p > maxForMode}
              >
                {p >= 1000 ? `${p / 1000}k` : p}
              </button>
            ))}
          </div>
        </div>

        {/* Over-cap warning */}
        {overCap && (
          <div className="warn-box warn-box--cap">
            ⚠ This demo server is intentionally lean — {mode === 'concurrent' ? 'concurrent' : 'sequential'} requests
            are capped at <strong>{maxForMode}</strong> for this endpoint to keep results meaningful and avoid
            exhausting the connection pool. The burst will run with {maxForMode} requests.
          </div>
        )}
      </div>

      {/* ── Mode ── */}
      <label className="field-label" style={{ marginTop: '1.2rem' }}>Mode</label>
      <div className="mode-group">
        {['sequential', 'concurrent'].map(m => (
          <label key={m} className={`mode-btn ${mode === m ? 'mode-btn--active' : ''}`}>
            <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => handleModeChange(m)} />
            {m === 'sequential' ? '⏱ Sequential' : '⚡ Concurrent'}
          </label>
        ))}
      </div>

      {/* ── Sequential delay ── */}
      {mode === 'sequential' && (
        <div className="field" style={{ marginTop: '.75rem' }}>
          <label className="field-label">
            Delay between requests (ms)
            {minDelayRequired > 0 && (
              <span className="field-cap-hint">(min {minDelayRequired} ms for {numReqs} requests)</span>
            )}
          </label>
          <input
            type="number"
            className={`input ${delayAutoUp ? 'input--warn' : ''}`}
            min="0"
            max="60000"
            step="10"
            value={delayMs}
            onChange={e => setDelayMs(Number(e.target.value))}
            placeholder="0 = no delay"
          />
          {delayAutoUp && (
            <div className="warn-box">
              ⚠ A minimum delay of <strong>{minDelayRequired} ms</strong> is enforced for{' '}
              {numReqs} sequential requests to protect the server.
              Effective delay: <strong>{effectiveDelay} ms</strong>.
            </div>
          )}
        </div>
      )}

      {/* ── Progress bar ── */}
      {isBursting && (
        <div className="burst-progress">
          <div className="burst-progress-bar" style={{ width: progress + '%' }} />
          <span className="burst-progress-label">{progress}%</span>
        </div>
      )}

      {/* ── Fire / Stop buttons ── */}
      <div className="fire-row">
        <button
          className="btn btn--fire"
          onClick={onRunBurst}
          disabled={isBursting}
        >
          {isBursting ? <span className="spinner" /> : '🔥'}&nbsp;
          Fire {Math.min(numReqs, maxForMode).toLocaleString()} Requests
        </button>
        {isBursting && (
          <button className="btn btn--stop" onClick={onStopBurst}>
            ⏹ Stop
          </button>
        )}
      </div>
    </div>
  )
}

