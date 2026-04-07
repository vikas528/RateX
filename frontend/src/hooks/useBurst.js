/**
 * useBurst.js
 *
 * Encapsulates all burst-test logic: firing sequential or concurrent batches
 * of requests, live progress tracking, and result collection.
 * Components only need to bind the returned state and callbacks.
 */
import { useState, useCallback, useRef } from 'react'
import { apiUrl } from '../constants/api'
import { DEFAULT_REQUEST_COUNT } from '../constants/ui'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export function useBurst() {
  const [numReqs,    setNumReqsState] = useState(DEFAULT_REQUEST_COUNT)
  const [numReqsRaw, setNumReqsRaw]  = useState(String(DEFAULT_REQUEST_COUNT))
  const [mode,       setMode]        = useState('sequential')
  const [delayMs,    setDelayMs]     = useState(0)
  const [results,    setResults]     = useState([])
  const [isBursting, setIsBursting]  = useState(false)
  const [progress,   setProgress]    = useState(0)
  const abortRef = useRef(false)

  // ── Helpers ──────────────────────────────────────────────────────────────
  const setNumReqs = useCallback((n) => {
    setNumReqsState(n)
    setNumReqsRaw(String(n))
  }, [])

  const handleNumReqsChange = useCallback((raw) => {
    setNumReqsRaw(raw)
    const n = parseInt(raw, 10)
    if (!isNaN(n) && n >= 1 && n <= 10000) setNumReqsState(n)
  }, [])

  // ── Fire a single request and return timing + header data ─────────────────
  const fireOne = useCallback(async (endpoint, n) => {
    const t0  = performance.now()
    const res = await fetch(apiUrl(endpoint.url), { method: endpoint.method })
    const ms  = Math.round(performance.now() - t0)
    return {
      n,
      status:    res.status,
      remaining: res.headers.get('X-RateLimit-Remaining'),
      reset:     res.headers.get('X-RateLimit-Reset'),
      ms,
    }
  }, [])

  // ── Run the burst ─────────────────────────────────────────────────────────
  const runBurst = useCallback(async (endpoint) => {
    setResults([])
    setProgress(0)
    setIsBursting(true)
    abortRef.current = false

    const count     = numReqs
    const collected = new Array(count)

    if (mode === 'concurrent') {
      // Fire ALL requests simultaneously — true concurrent execution.
      // We build every promise up-front so they all start at the same instant.
      const allPromises = Array.from({ length: count }, (_, i) =>
        fireOne(endpoint, i + 1),
      )
      // Track individual completions for a live progress bar
      let done = 0
      const withProgress = allPromises.map((p, i) =>
        p.then(
          (v) => { done++; setProgress(Math.round((done / count) * 100)); return v },
          ()  => { done++; setProgress(Math.round((done / count) * 100)); return { n: i + 1, status: 'ERR', remaining: '—', ms: 0 } },
        ),
      )
      const settled = await Promise.allSettled(withProgress)
      settled.forEach((s, i) => {
        collected[i] = s.status === 'fulfilled'
          ? s.value
          : { n: i + 1, status: 'ERR', remaining: '—', ms: 0 }
      })
      setResults(collected.filter(Boolean))
    } else {
      // Sequential — fire one at a time with optional delay
      for (let i = 0; i < count; i++) {
        if (abortRef.current) break
        const r = await fireOne(endpoint, i + 1)
        collected[i] = r
        // Throttle re-renders for large bursts
        if (count <= 200 || i % 10 === 0 || i === count - 1) {
          setResults(collected.slice(0, i + 1))
        }
        setProgress(Math.round(((i + 1) / count) * 100))
        if (delayMs > 0) await sleep(delayMs)
      }
      setResults(collected.filter(Boolean))
    }

    setIsBursting(false)
    setProgress(100)
  }, [numReqs, mode, delayMs, fireOne])

  const stopBurst = useCallback(() => {
    abortRef.current = true
  }, [])

  const clearResults = useCallback(() => setResults([]), [])

  return {
    // state
    numReqs, numReqsRaw,
    mode,    setMode,
    delayMs, setDelayMs,
    results,
    isBursting,
    progress,
    // actions
    setNumReqs,
    handleNumReqsChange,
    runBurst,
    stopBurst,
    clearResults,
  }
}
