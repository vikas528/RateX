/**
 * useBurst.js
 *
 * Encapsulates all burst-test logic: firing sequential or concurrent batches
 * of requests, live progress tracking, and result collection.
 * Components only need to bind the returned state and callbacks.
 *
 * Enforcement rules (all configurable via ui.js constants):
 *  • Concurrent requests are hard-capped at endpoint.maxConcurrent.
 *  • Sequential requests are hard-capped at endpoint.maxSequential.
 *  • Sequential inter-request delay is raised to getMinDelay(count) when the
 *    user-set delay is below the tier minimum for the chosen request count.
 */
import { useState, useCallback, useRef } from 'react'
import { apiUrl } from '../constants/api'
import { DEFAULT_REQUEST_COUNT, getMinDelay } from '../constants/ui'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/** Returns a random integer between min and max (inclusive). */
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

export function useBurst() {
  const [numReqs,    setNumReqsState] = useState(DEFAULT_REQUEST_COUNT)
  const [numReqsRaw, setNumReqsRaw]  = useState(String(DEFAULT_REQUEST_COUNT))
  const [mode,       setMode]        = useState('sequential')
  // 'fixed'  — single delayMs value applied to every request
  // 'random' — a random delay in [delayMin, delayMax] is drawn per request
  const [delayMode,  setDelayMode]   = useState('fixed')
  const [delayMs,    setDelayMs]     = useState(0)
  const [delayMin,   setDelayMin]    = useState(0)
  const [delayMax,   setDelayMax]    = useState(1000)
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
    if (!isNaN(n) && n >= 1) setNumReqsState(n)
  }, [])

  // ── Derived constraint values (consumed by BurstPanel for warnings) ───────
  /** Minimum delay required for the current sequential count (per tier rules). */
  const minDelayRequired = getMinDelay(numReqs)
  /** The delay that will actually be used when firing — always ≥ minDelayRequired.
   *  For random mode this is the floor applied to the drawn value. */
  const effectiveDelay = Math.max(delayMs, minDelayRequired)
  /** In random mode: the effective lower bound after the tier floor is applied. */
  const effectiveDelayMin = Math.max(delayMin, minDelayRequired)

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

    if (mode === 'concurrent') {
      // Cap count to the endpoint's concurrent limit
      const count     = Math.min(numReqs, endpoint.maxConcurrent)
      const collected = new Array(count)

      // Fire ALL requests simultaneously — true concurrent execution.
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
      // Cap count to the endpoint's sequential limit; enforce minimum delay tier
      const count    = Math.min(numReqs, endpoint.maxSequential)
      const tierMin  = getMinDelay(count)
      const collected = new Array(count)

      for (let i = 0; i < count; i++) {
        if (abortRef.current) break
        const r = await fireOne(endpoint, i + 1)
        collected[i] = r
        // Throttle re-renders for large bursts
        if (count <= 200 || i % 10 === 0 || i === count - 1) {
          setResults(collected.slice(0, i + 1))
        }
        setProgress(Math.round(((i + 1) / count) * 100))
        // Compute per-request delay: fixed or random, always ≥ tier floor
        let useDelay
        if (delayMode === 'random') {
          const lo = Math.max(delayMin, tierMin)
          const hi = Math.max(delayMax, lo)        // prevent hi < lo
          useDelay = randomBetween(lo, hi)
        } else {
          useDelay = Math.max(delayMs, tierMin)
        }
        if (useDelay > 0) await sleep(useDelay)
      }
      setResults(collected.filter(Boolean))
    }

    setIsBursting(false)
    setProgress(100)
  }, [numReqs, mode, delayMode, delayMs, delayMin, delayMax, fireOne])

  const stopBurst = useCallback(() => {
    abortRef.current = true
  }, [])

  const clearResults = useCallback(() => setResults([]), [])

  return {
    // state
    numReqs, numReqsRaw,
    mode,    setMode,
    delayMode, setDelayMode,
    delayMs,   setDelayMs,
    delayMin,  setDelayMin,
    delayMax,  setDelayMax,
    results,
    isBursting,
    progress,
    // derived constraint helpers (used by BurstPanel for inline warnings)
    minDelayRequired,
    effectiveDelay,
    effectiveDelayMin,
    // actions
    setNumReqs,
    handleNumReqsChange,
    runBurst,
    stopBurst,
    clearResults,
  }
}

