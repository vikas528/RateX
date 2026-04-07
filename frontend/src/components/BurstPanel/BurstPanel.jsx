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
  SEQUENTIAL_MAX_DELAY_MS,
} from '../../constants/ui'

export default function BurstPanel({
  // burst hook state
  numReqs,
  numReqsRaw,
  mode,
  delayMode,
  delayMs,
  delayMin,
  delayMax,
  isBursting,
  progress,
  minDelayRequired,
  effectiveDelay,
  effectiveDelayMin,
  // burst hook actions
  setMode,
  setDelayMode,
  setDelayMs,
  setDelayMin,
  setDelayMax,
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
  const delayAutoUp  = mode === 'sequential' && delayMode === 'fixed' && minDelayRequired > 0 && delayMs < minDelayRequired
  const rangeInvalid = mode === 'sequential' && delayMode === 'random' && delayMin > delayMax

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
        <div style={{ marginTop: '.75rem' }}>

          {/* Fixed / Random toggle */}
          <label className="field-label" style={{ marginBottom: '.5rem' }}>
            Delay between requests
            <span className="field-cap-hint">(0 – 20,000 ms)</span>
          </label>
          <div className="mode-group" style={{ marginBottom: '.6rem' }}>
            <label className={`mode-btn ${delayMode === 'fixed'  ? 'mode-btn--active' : ''}`}>
              <input type="radio" name="delayMode" value="fixed"
                checked={delayMode === 'fixed'} onChange={() => setDelayMode('fixed')} />
              Fixed
            </label>
            <label className={`mode-btn ${delayMode === 'random' ? 'mode-btn--active' : ''}`}>
              <input type="radio" name="delayMode" value="random"
                checked={delayMode === 'random'} onChange={() => setDelayMode('random')} />
              Random Range
            </label>
          </div>

          {/* Fixed delay */}
          {delayMode === 'fixed' && (
            <div className="field">
              <label className="field-label">
                Delay (ms)
                {minDelayRequired > 0 &&
                  <span className="field-cap-hint">(min {minDelayRequired} ms enforced)</span>}
              </label>
              <input
                type="number"
                className={`input ${delayAutoUp ? 'input--warn' : ''}`}
                min="0"
                max={SEQUENTIAL_MAX_DELAY_MS}
                step="10"
                value={delayMs}
                onChange={e => setDelayMs(Math.min(Number(e.target.value), SEQUENTIAL_MAX_DELAY_MS))}
                placeholder="0 = no delay"
              />
              {delayAutoUp && (
                <div className="warn-box">
                  ⚠ Minimum delay of <strong>{minDelayRequired} ms</strong> enforced for{' '}
                  {numReqs} requests. Effective: <strong>{effectiveDelay} ms</strong>.
                </div>
              )}
            </div>
          )}

          {/* Random range delay */}
          {delayMode === 'random' && (
            <div>
              <div className="field-row">
                <div className="field">
                  <label className="field-label">
                    Min (ms)
                    {minDelayRequired > 0 &&
                      <span className="field-cap-hint">(≥ {minDelayRequired})</span>}
                  </label>
                  <input
                    type="number"
                    className={`input ${rangeInvalid ? 'input--warn' : ''}`}
                    min="0"
                    max={SEQUENTIAL_MAX_DELAY_MS}
                    step="10"
                    value={delayMin}
                    onChange={e => setDelayMin(Math.min(Number(e.target.value), SEQUENTIAL_MAX_DELAY_MS))}
                    placeholder="0"
                  />
                </div>
                <div className="field">
                  <label className="field-label">Max (ms)</label>
                  <input
                    type="number"
                    className={`input ${rangeInvalid ? 'input--warn' : ''}`}
                    min="0"
                    max={SEQUENTIAL_MAX_DELAY_MS}
                    step="10"
                    value={delayMax}
                    onChange={e => setDelayMax(Math.min(Number(e.target.value), SEQUENTIAL_MAX_DELAY_MS))}
                    placeholder="1000"
                  />
                </div>
              </div>
              {rangeInvalid && (
                <div className="warn-box">
                  ⚠ Min delay cannot exceed max delay.
                </div>
              )}
              {!rangeInvalid && minDelayRequired > 0 && delayMin < minDelayRequired && (
                <div className="warn-box">
                  ⚠ Minimum delay of <strong>{minDelayRequired} ms</strong> enforced — random values
                  will be drawn from <strong>{effectiveDelayMin}–{Math.max(delayMax, effectiveDelayMin)} ms</strong>.
                </div>
              )}
              {!rangeInvalid && (
                <p style={{ fontSize: '.75rem', color: 'var(--text-dim)', marginTop: '.4rem' }}>
                  Each request waits a random delay between {Math.max(delayMin, minDelayRequired)} ms and{' '}
                  {Math.max(delayMax, Math.max(delayMin, minDelayRequired))} ms.
                </p>
              )}
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

