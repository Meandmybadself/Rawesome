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
        <h1 className="topbar__title" onClick={() => setView('library')}>Raw Dog</h1>
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
