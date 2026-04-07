/**
 * VisualizerCard.jsx   (index for the visualizer/ sub-tree)
 *
 * Polls the backend for the current rate-limiter state and renders the
 * appropriate algorithm visualisation.  Re-connects automatically whenever
 * activeConfig changes (algo swap, limit change, etc.).
 */
import { useState, useEffect, useRef } from 'react'
import { apiUrl, ROUTES } from '../../constants/api'
import { VISUALIZER_POLL_MS, MSG_CONNECTING } from '../../constants/ui'
import { ALGOS } from '../../constants/algorithms'
import TokenBucketViz   from './TokenBucketViz'
import FixedWindowViz   from './FixedWindowViz'
import SlidingWindowViz from './SlidingWindowViz'

export default function VisualizerCard({ activeConfig }) {
  const [state,    setState]  = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    setState(null)

    const poll = () =>
      fetch(apiUrl(ROUTES.VISUALIZER_STATE))
        .then(r => r.json())
        .then(setState)
        .catch(() => {})

    poll()
    timerRef.current = setInterval(poll, VISUALIZER_POLL_MS)
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
