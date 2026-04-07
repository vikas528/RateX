/**
 * VisualizerCard.jsx   (index for the visualizer/ sub-tree)
 *
 * Polling lifecycle:
 *  1. One-shot fetch on config change → shows current state while idle.
 *  2. While isBursting = true         → interval poll at VISUALIZER_POLL_MS (LIVE badge).
 *  3. After burst ends (settling)     → keep polling until the limiter fully recovers,
 *     then do one final fetch to capture the resting state, then stop (badge → IDLE).
 *
 * "Fully recovered" per algorithm:
 *   token_bucket   — percent_full reaches exactly 100 (tokens === capacity)
 *   fixed_window   — count drops to 0 (window reset)
 *   sliding_window — count drops to 0 (all requests aged out)
 */
import { useState, useEffect, useRef } from 'react'
import { apiUrl, ROUTES } from '../../constants/api'
import { VISUALIZER_POLL_MS, MSG_CONNECTING } from '../../constants/ui'
import { ALGOS } from '../../constants/algorithms'
import TokenBucketViz   from './TokenBucketViz'
import FixedWindowViz   from './FixedWindowViz'
import SlidingWindowViz from './SlidingWindowViz'

/**
 * Returns true once the rate-limiter has fully recovered to its resting state.
 *
 * Token bucket: we wait for percent_full === 100 (not just ≥ 99) so the
 * visualizer never gets stuck showing a partial fill like "99.03 / 100".
 * The backend rounds tokens to 2 dp and clamps at capacity, so percent_full
 * will reach exactly 100.0 once the bucket is genuinely full.
 */
function isFullyRecovered(state) {
  if (!state) return false
  switch (state.algo) {
    case ALGOS.TOKEN_BUCKET:   return (state.percent_full ?? 0) >= 100
    case ALGOS.FIXED_WINDOW:   return (state.count ?? 0) === 0
    case ALGOS.SLIDING_WINDOW: return (state.count ?? 0) === 0
    default:                   return true
  }
}

export default function VisualizerCard({ activeConfig, isBursting }) {
  const [state,     setState]    = useState(null)
  // isPolling = true while burst is active OR while settling (waiting for full recovery)
  const [isPolling, setIsPolling] = useState(false)
  const isBurstingRef = useRef(isBursting)

  // Keep the ref in sync so the interval callback always sees the latest value
  useEffect(() => { isBurstingRef.current = isBursting }, [isBursting])

  // Start settling poll as soon as a burst begins
  useEffect(() => {
    if (isBursting) setIsPolling(true)
  }, [isBursting])

  // Polling loop — runs while isPolling is true
  useEffect(() => {
    if (!isPolling) return

    const fetchState = () =>
      fetch(apiUrl(ROUTES.VISUALIZER_STATE))
        .then(r => r.json())

    const poll = () =>
      fetchState()
        .then(data => {
          setState(data)
          // Only stop once the burst is finished AND the limiter is fully recovered.
          // After stopping, do one extra fetch so the display reflects the true
          // resting value (e.g. 100/100 tokens) rather than the last mid-recovery poll.
          if (!isBurstingRef.current && isFullyRecovered(data)) {
            setIsPolling(false)
            // Small delay lets any in-flight Redis writes settle before the final read
            setTimeout(() => fetchState().then(setState).catch(() => {}), 200)
          }
        })
        .catch(() => {})

    const id = setInterval(poll, VISUALIZER_POLL_MS)
    return () => clearInterval(id)
  }, [isPolling])

  // One-shot fetch whenever the active config changes (idle, no interval)
  useEffect(() => {
    setState(null)
    fetch(apiUrl(ROUTES.VISUALIZER_STATE))
      .then(r => r.json())
      .then(setState)
      .catch(() => {})
  }, [
    activeConfig?.algo,
    activeConfig?.limit,
    activeConfig?.window_seconds,
    activeConfig?.refill_rate,
  ])

  const showLive = isPolling

  return (
    <div className="card viz-card">
      <div className="viz-header">
        <h2 className="card-title" style={{ margin: 0 }}>Live Visualizer</h2>
        <div className={`viz-live-badge ${showLive ? '' : 'viz-live-badge--idle'}`}>
          {showLive ? <span className="viz-pulse" /> : <span className="viz-pulse viz-pulse--idle" />}
          {showLive ? 'LIVE' : 'IDLE'}
        </div>
      </div>

      {!state ? (
        <div className="viz-loading">{MSG_CONNECTING}</div>
      ) : (
        <>
          {state.algo === ALGOS.TOKEN_BUCKET   && <TokenBucketViz   state={state} />}
          {state.algo === ALGOS.FIXED_WINDOW   && <FixedWindowViz   state={state} />}
          {state.algo === ALGOS.SLIDING_WINDOW && <SlidingWindowViz state={state} />}
        </>
      )}
    </div>
  )
}
