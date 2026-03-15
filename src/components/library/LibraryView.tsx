import { useCallback } from 'react'
import { useFileStore } from '../../stores/fileStore'
import { useEditStore } from '../../stores/editStore'
import { useUIStore } from '../../stores/uiStore'
import { opfsManager } from '../../lib/opfs/OPFSManager'
import { decodePool } from '../../workers/WorkerPool'
import { DEFAULT_EDIT_PARAMS } from '../../types'
import type { CatalogEntry, FileId } from '../../types'
import { DropZone } from './DropZone'
import { ThumbnailGrid } from './ThumbnailGrid'
import './LibraryView.css'

export function LibraryView() {
  const catalog = useFileStore((s) => s.catalog)
  const addEntry = useFileStore((s) => s.addEntry)
  const updateEntry = useFileStore((s) => s.updateEntry)
  const removeEntry = useFileStore((s) => s.removeEntry)
  const setCurrentFile = useFileStore((s) => s.setCurrentFile)
  const loadParams = useEditStore((s) => s.loadParams)
  const setView = useUIStore((s) => s.setView)
  const setDecodeProgress = useUIStore((s) => s.setDecodeProgress)
  const setError = useUIStore((s) => s.setError)

  const entries = Object.values(catalog).sort((a, b) => b.importedAt - a.importedAt)

  const handleImport = useCallback(async (files: File[]) => {
    let completed = 0
    const total = files.length
    setDecodeProgress({ phase: `Importing 0/${total}...`, percent: 0 })

    const importOne = async (file: File) => {
      const id = crypto.randomUUID()
      const entry: CatalogEntry = {
        id,
        originalName: file.name,
        fileSize: file.size,
        importedAt: Date.now(),
        editedAt: Date.now(),
        width: null,
        height: null,
        thumbnailReady: false,
      }
      addEntry(entry)

      try {
        const buffer = await file.arrayBuffer()
        await opfsManager.writeRaw(id, buffer)

        const result = await decodePool.decode(buffer.slice(0), true)

        updateEntry(id, { width: result.width, height: result.height })

        // Generate thumbnail
        const pixels = new Float32Array(result.pixels)
        const srcW = result.width
        const srcH = result.height
        const canvas = new OffscreenCanvas(srcW, srcH)
        const ctx = canvas.getContext('2d')!
        const imgData = ctx.createImageData(srcW, srcH)
        const pixelCount = srcW * srcH
        for (let i = 0; i < pixelCount; i++) {
          imgData.data[i * 4]     = Math.round(Math.min(1, Math.max(0, pixels[i * 3])) * 255)
          imgData.data[i * 4 + 1] = Math.round(Math.min(1, Math.max(0, pixels[i * 3 + 1])) * 255)
          imgData.data[i * 4 + 2] = Math.round(Math.min(1, Math.max(0, pixels[i * 3 + 2])) * 255)
          imgData.data[i * 4 + 3] = 255
        }
        ctx.putImageData(imgData, 0, 0)

        const thumbW = 320
        const thumbH = Math.round(thumbW * (srcH / srcW))
        const thumbCanvas = new OffscreenCanvas(thumbW, thumbH)
        const thumbCtx = thumbCanvas.getContext('2d')!
        thumbCtx.drawImage(canvas, 0, 0, thumbW, thumbH)

        const blob = await thumbCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 })
        await opfsManager.writeThumbnail(id, blob)
        updateEntry(id, { thumbnailReady: true })
      } catch (err) {
        console.error('Import failed:', err)
        setError(`Failed to import ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        removeEntry(id)
        try { await opfsManager.deleteFile(id) } catch { /* best effort */ }
      } finally {
        completed++
        setDecodeProgress({
          phase: `Importing ${completed}/${total}...`,
          percent: Math.round((completed / total) * 100),
        })
      }
    }

    // Fire all imports concurrently — the worker pool handles queuing
    await Promise.all(files.map(importOne))
    setDecodeProgress(null)
  }, [addEntry, updateEntry, removeEntry, setDecodeProgress, setError])

  const handleOpen = useCallback(async (id: FileId) => {
    setCurrentFile(id)
    const savedParams = await opfsManager.readParams(id)
    loadParams(savedParams ?? { ...DEFAULT_EDIT_PARAMS })
    setView('edit')
  }, [setCurrentFile, loadParams, setView])

  const handleDelete = useCallback(async (id: FileId) => {
    try {
      await opfsManager.deleteFile(id)
    } catch {
      // File might not exist in OPFS yet
    }
    removeEntry(id)
  }, [removeEntry])

  const handleClearAll = useCallback(async () => {
    const ids = Object.keys(catalog)
    if (ids.length === 0) return
    for (const id of ids) {
      try { await opfsManager.deleteFile(id) } catch { /* best effort */ }
      removeEntry(id)
    }
    setCurrentFile(null)
  }, [catalog, removeEntry, setCurrentFile])

  return (
    <div className="library-view">
      <DropZone onFiles={handleImport}>
        {entries.length > 0 && (
          <div className="library-view__toolbar">
            <button className="library-view__clear-btn" onClick={handleClearAll}>
              Clear All
            </button>
          </div>
        )}
        <ThumbnailGrid entries={entries} onOpen={handleOpen} onDelete={handleDelete} />
      </DropZone>
    </div>
  )
}
