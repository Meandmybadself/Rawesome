import { useEffect, useState } from 'react'
import type { CatalogEntry, FileId } from '../../types'
import { opfsManager } from '../../lib/opfs/OPFSManager'
import './ThumbnailGrid.css'

interface ThumbnailGridProps {
  entries: CatalogEntry[]
  onOpen: (id: FileId) => void
  onDelete: (id: FileId) => void
}

export function ThumbnailGrid({ entries, onOpen, onDelete }: ThumbnailGridProps) {
  if (entries.length === 0) {
    return (
      <div className="thumbnail-grid__empty">
        <p>No RAW files imported yet.</p>
        <p>Drag and drop files or click Import to get started.</p>
      </div>
    )
  }

  return (
    <div className="thumbnail-grid">
      {entries.map((entry) => (
        <ThumbnailCard key={entry.id} entry={entry} onOpen={onOpen} onDelete={onDelete} />
      ))}
    </div>
  )
}

function ThumbnailCard({ entry, onOpen, onDelete }: {
  entry: CatalogEntry
  onOpen: (id: FileId) => void
  onDelete: (id: FileId) => void
}) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)

  useEffect(() => {
    let revoke: string | null = null
    if (entry.thumbnailReady) {
      opfsManager.readThumbnailURL(entry.id).then((url) => {
        if (url) {
          revoke = url
          setThumbUrl(url)
        }
      })
    }
    return () => {
      if (revoke) URL.revokeObjectURL(revoke)
    }
  }, [entry.id, entry.thumbnailReady])

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(entry.id)
  }

  return (
    <div className="thumbnail-card" onClick={() => onOpen(entry.id)}>
      <div className="thumbnail-card__image">
        {thumbUrl ? (
          <img src={thumbUrl} alt={entry.originalName} />
        ) : (
          <div className="thumbnail-card__placeholder">
            {entry.thumbnailReady ? 'Loading...' : 'Processing...'}
          </div>
        )}
      </div>
      <div className="thumbnail-card__info">
        <span className="thumbnail-card__name" title={entry.originalName}>
          {entry.originalName}
        </span>
        <button className="thumbnail-card__delete" onClick={handleDelete} aria-label="Delete">
          &times;
        </button>
      </div>
    </div>
  )
}
