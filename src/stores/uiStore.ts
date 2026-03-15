import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AppView, ActiveTool, Theme } from '../types'

interface UIState {
  view: AppView
  theme: Theme
  activeTool: ActiveTool
  isExportPanelOpen: boolean
  isHistogramVisible: boolean
  decodeProgress: { phase: string; percent: number } | null
  exportProgress: { phase: string; percent: number } | null
  error: string | null

  setView: (view: AppView) => void
  setTheme: (theme: Theme) => void
  setActiveTool: (tool: ActiveTool) => void
  toggleExportPanel: () => void
  toggleHistogram: () => void
  setDecodeProgress: (p: { phase: string; percent: number } | null) => void
  setExportProgress: (p: { phase: string; percent: number } | null) => void
  setError: (msg: string | null) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      view: 'library',
      theme: 'dark',
      activeTool: 'adjust',
      isExportPanelOpen: false,
      isHistogramVisible: true,
      decodeProgress: null,
      exportProgress: null,
      error: null,

      setView: (view) => set({ view }),
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },
      setActiveTool: (activeTool) => set({ activeTool }),
      toggleExportPanel: () => set((s) => ({ isExportPanelOpen: !s.isExportPanelOpen })),
      toggleHistogram: () => set((s) => ({ isHistogramVisible: !s.isHistogramVisible })),
      setDecodeProgress: (decodeProgress) => set({ decodeProgress }),
      setExportProgress: (exportProgress) => set({ exportProgress }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'rawdog-ui-prefs',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        isHistogramVisible: state.isHistogramVisible,
      }),
    },
  ),
)
