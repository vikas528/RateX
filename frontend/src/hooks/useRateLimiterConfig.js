/**
 * useRateLimiterConfig.js
 *
 * Fetches the active rate-limiter config from the backend on mount and exposes
 * state + an applyConfig callback.  Keeps all config-related network logic out
 * of the rendering components.
 */
import { useState, useEffect, useCallback } from 'react'
import { apiUrl, ROUTES } from '../constants/api'
import {
  MSG_CONFIG_APPLIED,
  MSG_CONFIG_FAILED,
  MSG_NETWORK_ERROR,
  MSG_CONFIG_CLEAR_AFTER_MS,
} from '../constants/ui'
import { DEFAULT_ALGO } from '../constants/algorithms'

export function useRateLimiterConfig() {
  const [activeConfig, setActiveConfig] = useState(null)
  const [algo,         setAlgo]         = useState(DEFAULT_ALGO)
  const [limit,        setLimit]        = useState(10)
  const [windowSecs,   setWindowSecs]   = useState(60)
  const [refillRate,   setRefillRate]   = useState(1.0)
  const [isApplying,   setIsApplying]   = useState(false)
  const [configMsg,    setConfigMsg]    = useState('')

  // ── Load config on mount ────────────────────────────────────────────────
  useEffect(() => {
    fetch(apiUrl(ROUTES.CONFIG))
      .then(r => r.json())
      .then(cfg => {
        setActiveConfig(cfg)
        setAlgo(cfg.algo)
        setLimit(cfg.limit)
        setWindowSecs(cfg.window_seconds)
        setRefillRate(cfg.refill_rate ?? 1.0)
      })
      .catch(() => {}) // silently ignore — backend may not be ready yet
  }, [])

  // ── Apply (POST) new config ─────────────────────────────────────────────
  const applyConfig = useCallback(async () => {
    setIsApplying(true)
    setConfigMsg('')
    try {
      const body = {
        algo,
        limit:          Number(limit),
        window_seconds: Number(windowSecs),
        refill_rate:    Number(refillRate),
      }
      const res  = await fetch(apiUrl(ROUTES.CONFIG), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        setActiveConfig(data)
        setConfigMsg(MSG_CONFIG_APPLIED)
      } else {
        setConfigMsg('✗ ' + (data.error || MSG_CONFIG_FAILED))
      }
    } catch {
      setConfigMsg(MSG_NETWORK_ERROR)
    } finally {
      setIsApplying(false)
      setTimeout(() => setConfigMsg(''), MSG_CONFIG_CLEAR_AFTER_MS)
    }
  }, [algo, limit, windowSecs, refillRate])

  return {
    // state
    activeConfig,
    algo,       setAlgo,
    limit,      setLimit,
    windowSecs, setWindowSecs,
    refillRate, setRefillRate,
    isApplying,
    configMsg,
    // actions
    applyConfig,
  }
}
