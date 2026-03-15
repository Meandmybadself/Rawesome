import { useEffect } from 'react'
import { useEditStore } from '../stores/editStore'
import { useUIStore } from '../stores/uiStore'

export function useKeyboardShortcuts() {
  const undo = useEditStore((s) => s.undo)
  const redo = useEditStore((s) => s.redo)
  const toggleShowOriginal = useEditStore((s) => s.toggleShowOriginal)
  const setActiveTool = useUIStore((s) => s.setActiveTool)
  const setView = useUIStore((s) => s.setView)
  const view = useUIStore((s) => s.view)

  useEffect(() => {
    if (view !== 'edit') return

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) return

      const key = e.key.toLowerCase()
      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl && key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return }
      if (ctrl && (key === 'y' || (key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return }

      switch (key) {
        case 'c': setActiveTool('crop'); break
        case 'v': setActiveTool('adjust'); break
        case '\\': toggleShowOriginal(true); break
        case 'escape': setView('library'); break
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === '\\') toggleShowOriginal(false)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [view, undo, redo, toggleShowOriginal, setActiveTool, setView])
}
