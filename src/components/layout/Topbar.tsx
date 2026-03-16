import { useUIStore } from '../../stores/uiStore'
import './Topbar.css'

export function Topbar() {
  const view = useUIStore((s) => s.view)
  const theme = useUIStore((s) => s.theme)
  const setView = useUIStore((s) => s.setView)
  const setTheme = useUIStore((s) => s.setTheme)
  const decodeProgress = useUIStore((s) => s.decodeProgress)

  return (
    <header className="topbar">
      <div className="topbar__left">
        <h1 className="topbar__title" onClick={() => setView('library')}>Rawesome</h1>
        {view === 'edit' && (
          <button className="topbar__back" onClick={() => setView('library')}>
            &larr; Library
          </button>
        )}
      </div>

      <div className="topbar__center">
        {decodeProgress && (
          <div className="topbar__progress">
            <span>{decodeProgress.phase}</span>
            <div className="topbar__progress-bar">
              <div
                className="topbar__progress-fill"
                style={{ width: `${decodeProgress.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="topbar__right">
        <a
          className="topbar__github"
          href="https://github.com/Meandmybadself/raw-dog"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View on GitHub"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </a>
        <button
          className="topbar__theme-toggle"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '\u2600' : '\u263E'}
        </button>
      </div>
    </header>
  )
}
