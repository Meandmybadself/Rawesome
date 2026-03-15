import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CatalogEntry, FileId } from '../types'

interface FileState {
  catalog: Record<FileId, CatalogEntry>
  currentFileId: FileId | null

  addEntry: (entry: CatalogEntry) => void
  updateEntry: (id: FileId, patch: Partial<CatalogEntry>) => void
  removeEntry: (id: FileId) => void
  setCurrentFile: (id: FileId | null) => void
  getCatalogArray: () => CatalogEntry[]
}

export const useFileStore = create<FileState>()(
  persist(
    (set, get) => ({
      catalog: {},
      currentFileId: null,

      addEntry: (entry) =>
        set((state) => ({
          catalog: { ...state.catalog, [entry.id]: entry },
        })),

      updateEntry: (id, patch) =>
        set((state) => ({
          catalog: {
            ...state.catalog,
            [id]: { ...state.catalog[id], ...patch },
          },
        })),

      removeEntry: (id) =>
        set((state) => {
          const next = { ...state.catalog }
          delete next[id]
          return {
            catalog: next,
            currentFileId: state.currentFileId === id ? null : state.currentFileId,
          }
        }),

      setCurrentFile: (id) => set({ currentFileId: id }),

      getCatalogArray: () => {
        const { catalog } = get()
        return Object.values(catalog).sort((a, b) => b.importedAt - a.importedAt)
      },
    }),
    {
      name: 'rawdog-file-catalog',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
