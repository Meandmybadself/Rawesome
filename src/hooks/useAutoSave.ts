import { useEffect, useRef } from 'react'
import { useEditStore } from '../stores/editStore'
import { useFileStore } from '../stores/fileStore'
import { opfsManager } from '../lib/opfs/OPFSManager'

const DEBOUNCE_MS = 1500

export function useAutoSave() {
  const currentFileId = useFileStore((s) => s.currentFileId)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!currentFileId) return

    // Subscribe to params changes directly (not isDirty)
    const unsub = useEditStore.subscribe(
      (state) => state.params,
      () => {
        if (timerRef.current) clearTimeout(timerRef.current)

        timerRef.current = setTimeout(async () => {
          const params = useEditStore.getState().params
          const fid = currentFileId
          try {
            await opfsManager.writeParams(fid, params)
            useEditStore.getState().markClean()
            useFileStore.getState().updateEntry(fid, { editedAt: Date.now() })
          } catch (err) {
            console.error('Auto-save failed:', err)
          }
        }, DEBOUNCE_MS)
      },
    )

    return () => {
      unsub()
      // Flush pending save on unmount
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        const params = useEditStore.getState().params
        opfsManager.writeParams(currentFileId, params).catch(() => {})
      }
    }
  }, [currentFileId])
}
