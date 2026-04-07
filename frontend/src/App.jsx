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
          onApply={configHook.applyConfig}
        />

        <BurstPanel
          numReqs={burstHook.numReqs}
          numReqsRaw={burstHook.numReqsRaw}
          mode={burstHook.mode}
          delayMs={burstHook.delayMs}
          isBursting={burstHook.isBursting}
          progress={burstHook.progress}
          setMode={burstHook.setMode}
          setDelayMs={burstHook.setDelayMs}
          setNumReqs={burstHook.setNumReqs}
          handleNumReqsChange={burstHook.handleNumReqsChange}
          endpoint={endpoint}
          setEndpoint={setEndpoint}
          onRunBurst={() => burstHook.runBurst(endpoint)}
          onStopBurst={burstHook.stopBurst}
        />
      </div>

      {/* ── Live visualizer ── */}
      <VisualizerCard activeConfig={configHook.activeConfig} />

      {/* ── Burst results ── */}
      <ResultsPanel
        results={burstHook.results}
        onClear={burstHook.clearResults}
      />
    </div>
  )
}
