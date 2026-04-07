/**
 * BurstPanel.jsx
 *
 * Card that lets the user configure and fire a burst of HTTP requests.
 * Uses the useBurst hook for state; receives the selected endpoint as a
 * prop so the parent (App) can wire it to a piece of its own state.
 */
import { BURST_ENDPOINTS } from '../../constants/api'
import { BURST_PRESETS, CONCURRENT_BATCH_SIZE } from '../../constants/ui'

export default function BurstPanel({
  // burst hook state
  numReqs,
  numReqsRaw,
  mode,
  delayMs,
  isBursting,
  progress,
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
        <label className="field-label">Number of Requests</label>
        <div className="req-count-row">
          <input
            type="number"
            className="input req-count-input"
            min="1" max="10000"
            value={numReqsRaw}
            onChange={e => handleNumReqsChange(e.target.value)}
          />
          <div className="preset-chips">
            {BURST_PRESETS.map(p => (
              <button
                key={p}
                className={`chip ${numReqs === p ? 'chip--active' : ''}`}
                onClick={() => setNumReqs(p)}
              >
                {p >= 1000 ? `${p / 1000}k` : p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mode ── */}
      <label className="field-label" style={{ marginTop: '1.2rem' }}>Mode</label>
      <div className="mode-group">
        {['sequential', 'concurrent'].map(m => (
          <label key={m} className={`mode-btn ${mode === m ? 'mode-btn--active' : ''}`}>
            <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} />
            {m === 'sequential' ? '⏱ Sequential' : '⚡ Concurrent'}
          </label>
        ))}
      </div>

      {/* ── Sequential delay ── */}
      {mode === 'sequential' && (
        <div className="field" style={{ marginTop: '.75rem' }}>
          <label className="field-label">Delay between requests (ms)</label>
          <input
            type="number" className="input" min="0" max="60000" step="10"
            value={delayMs}
            onChange={e => setDelayMs(Number(e.target.value))}
            placeholder="0 = no delay"
          />
        </div>
      )}

      {/* ── Large concurrent warning ── */}
      {mode === 'concurrent' && numReqs > 500 && (
        <div className="warn-box">
          ⚠ {numReqs.toLocaleString()} concurrent requests will be sent in
          batches of {CONCURRENT_BATCH_SIZE} to avoid crashing the browser.
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
          Fire {numReqs.toLocaleString()} Requests
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
