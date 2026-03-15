import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { EditParams } from '../types'
import { DEFAULT_EDIT_PARAMS } from '../types'

const MAX_UNDO = 100

interface EditSnapshot {
  params: EditParams
  timestamp: number
}

interface EditState {
  params: EditParams
  undoStack: EditSnapshot[]
  redoStack: EditSnapshot[]
  showOriginal: boolean
  isDirty: boolean

  setParam: <K extends keyof EditParams>(key: K, value: EditParams[K]) => void
  setParams: (partial: Partial<EditParams>) => void
  commitSnapshot: () => void
  undo: () => void
  redo: () => void
  resetToDefaults: () => void
  loadParams: (params: EditParams) => void
  toggleShowOriginal: (on: boolean) => void
  markClean: () => void
}

export const useEditStore = create<EditState>()(
  subscribeWithSelector((set, get) => ({
    params: { ...DEFAULT_EDIT_PARAMS },
    undoStack: [],
    redoStack: [],
    showOriginal: false,
    isDirty: false,

    setParam: (key, value) => {
      set((state) => ({
        params: { ...state.params, [key]: value },
        isDirty: true,
      }))
    },

    setParams: (partial) => {
      set((state) => ({
        params: { ...state.params, ...partial },
        isDirty: true,
      }))
    },

    commitSnapshot: () => {
      const { params, undoStack } = get()
      const snapshot: EditSnapshot = {
        params: structuredClone(params),
        timestamp: Date.now(),
      }
      set({
        undoStack: [...undoStack.slice(-(MAX_UNDO - 1)), snapshot],
        redoStack: [],
      })
    },

    undo: () => {
      const { undoStack, redoStack, params } = get()
      if (undoStack.length === 0) return
      const current: EditSnapshot = { params: structuredClone(params), timestamp: Date.now() }
      const prev = undoStack[undoStack.length - 1]
      set({
        params: structuredClone(prev.params),
        undoStack: undoStack.slice(0, -1),
        redoStack: [current, ...redoStack],
        isDirty: true,
      })
    },

    redo: () => {
      const { undoStack, redoStack, params } = get()
      if (redoStack.length === 0) return
      const current: EditSnapshot = { params: structuredClone(params), timestamp: Date.now() }
      const next = redoStack[0]
      set({
        params: structuredClone(next.params),
        undoStack: [...undoStack, current],
        redoStack: redoStack.slice(1),
        isDirty: true,
      })
    },

    resetToDefaults: () => {
      const { params } = get()
      const snapshot: EditSnapshot = { params: structuredClone(params), timestamp: Date.now() }
      set((state) => ({
        params: { ...DEFAULT_EDIT_PARAMS },
        undoStack: [...state.undoStack.slice(-(MAX_UNDO - 1)), snapshot],
        redoStack: [],
        isDirty: true,
      }))
    },

    loadParams: (params) => {
      set({
        params: structuredClone(params),
        undoStack: [],
        redoStack: [],
        isDirty: false,
      })
    },

    toggleShowOriginal: (on) => set({ showOriginal: on }),
    markClean: () => set({ isDirty: false }),
  })),
)
