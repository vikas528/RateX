/**
 * App.jsx — root composition component.
 *
 * Responsibilities:
 *  - Instantiate the two custom hooks (config management + burst testing)
 *  - Hold the selected endpoint state (shared between BurstPanel and useBurst)
 *  - Hold the theme state (dark / light) and apply it to <html>
 *  - Lay out the page using the individual presentational components
 *
 * No business logic, no hardcoded routes, no hardcoded colours live here.
 */
import { useState, useCallback, useEffect } from 'react'
import { BURST_ENDPOINTS } from './constants/api'

import { useRateLimiterConfig } from './hooks/useRateLimiterConfig'
import { useBurst }             from './hooks/useBurst'

import Header        from './components/Header/Header'
import ConfigPanel   from './components/ConfigPanel/ConfigPanel'
import BurstPanel    from './components/BurstPanel/BurstPanel'
import VisualizerCard from './components/visualizer/VisualizerCard'
import RequestGraph   from './components/RequestGraph/RequestGraph'
import ResultsPanel  from './components/ResultsPanel/ResultsPanel'

export default function App() {
  // ── Theme (dark / light) ─────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    // Persist user preference in localStorage
    return localStorage.getItem('ratex-theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('ratex-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  // ── Config hook ──────────────────────────────────────────────────────────
  const configHook = useRateLimiterConfig()

  // ── Burst hook ───────────────────────────────────────────────────────────
  const burstHook = useBurst()

  // ── Selected endpoint (drives both the burst panel selector and runBurst) ─
  const [endpoint, setEndpoint] = useState(BURST_ENDPOINTS[0])

  // Auto-clamp request count when the user switches to a lower-capped endpoint
  const handleEndpointChange = (ep) => {
    setEndpoint(ep)
    const cap = burstHook.mode === 'concurrent' ? ep.maxConcurrent : ep.maxSequential
    if (burstHook.numReqs > cap) burstHook.setNumReqs(cap)
  }

  return (
    <div className="app">

      {/* ── Header ── */}
      <Header
        activeConfig={configHook.activeConfig}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* ── Two-column panel grid ── */}
      <div className="panels">

        <ConfigPanel
          algo={configHook.algo}           setAlgo={configHook.setAlgo}
          limit={configHook.limit}         setLimit={configHook.setLimit}
          windowSecs={configHook.windowSecs} setWindowSecs={configHook.setWindowSecs}
          refillRate={configHook.refillRate} setRefillRate={configHook.setRefillRate}
          isApplying={configHook.isApplying}
          configMsg={configHook.configMsg}
          configStatus={configHook.configStatus}
          isDirty={configHook.isDirty}
          onApply={configHook.applyConfig}
        />

        <BurstPanel
          numReqs={burstHook.numReqs}
          numReqsRaw={burstHook.numReqsRaw}
          mode={burstHook.mode}
          delayMode={burstHook.delayMode}
          delayMs={burstHook.delayMs}
          delayMin={burstHook.delayMin}
          delayMax={burstHook.delayMax}
          isBursting={burstHook.isBursting}
          progress={burstHook.progress}
          minDelayRequired={burstHook.minDelayRequired}
          effectiveDelay={burstHook.effectiveDelay}
          effectiveDelayMin={burstHook.effectiveDelayMin}
          setMode={burstHook.setMode}
          setDelayMode={burstHook.setDelayMode}
          setDelayMs={burstHook.setDelayMs}
          setDelayMin={burstHook.setDelayMin}
          setDelayMax={burstHook.setDelayMax}
          setNumReqs={burstHook.setNumReqs}
          handleNumReqsChange={burstHook.handleNumReqsChange}
          endpoint={endpoint}
          setEndpoint={handleEndpointChange}
          onRunBurst={() => burstHook.runBurst(endpoint)}
          onStopBurst={burstHook.stopBurst}
        />
      </div>

      {/* ── Live visualizer ── */}
      <VisualizerCard activeConfig={configHook.activeConfig} isBursting={burstHook.isBursting} />

      {/* ── Request timeline graph ── */}
      <RequestGraph results={burstHook.results} isBursting={burstHook.isBursting} />

      {/* ── Burst results ── */}
      <ResultsPanel
        results={burstHook.results}
        onClear={burstHook.clearResults}
      />
    </div>
  )
}
