/**
 * Header.jsx
 *
 * Top navigation bar — shows logo, tag-line, and the currently active
 * rate-limiter config fetched from the backend.
 */
import { ALGO_LABELS } from '../../constants/algorithms'
import { ALGOS } from '../../constants/algorithms'

export default function Header({ activeConfig, theme, onToggleTheme }) {
  return (
    <header className="header">
      <div className="header-logo">
        <span className="logo-icon">⚡</span>
        <span className="logo-text">Rate<strong>X</strong></span>
      </div>

      <div className="header-tag">Rate Limiter Playground</div>

      {activeConfig && (
        <div className="header-active">
          Active:&nbsp;<strong>{ALGO_LABELS[activeConfig.algo]}</strong>
          &nbsp;·&nbsp;{activeConfig.limit} req
          {activeConfig.algo === ALGOS.TOKEN_BUCKET
            ? ` · refill ${activeConfig.refill_rate}/s`
            : ` / ${activeConfig.window_seconds}s`}
        </div>
      )}

      <button
        className="theme-toggle-btn"
        onClick={onToggleTheme}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </header>
  )
}
