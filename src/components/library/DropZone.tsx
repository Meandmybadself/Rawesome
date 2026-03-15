import { useState, useCallback, useRef } from 'react'
import { RAW_EXTENSIONS } from '../../lib/constants'
import './DropZone.css'

interface DropZoneProps {
  onFiles: (files: File[]) => void
  children?: React.ReactNode
}

export function DropZone({ onFiles, children }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const isRawFile = (file: File): boolean => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    return RAW_EXTENSIONS.has(ext)
  }

  const handleFiles = useCallback((fileList: FileList | File[]) => {
    const rawFiles = Array.from(fileList).filter(isRawFile)
    if (rawFiles.length > 0) onFiles(rawFiles)
  }, [onFiles])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
    e.target.value = ''
  }, [handleFiles])

  return (
    <div
      className={`dropzone ${isDragOver ? 'dropzone--active' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      {isDragOver && (
        <div className="dropzone__overlay">
          <div className="dropzone__overlay-text">Drop RAW files here</div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".cr2,.cr3,.nef,.nrw,.arw,.srf,.sr2,.dng,.raf,.orf,.rw2,.pef,.srw,.x3f"
        multiple
        onChange={handleInputChange}
        className="dropzone__input"
      />
      <button className="dropzone__import-btn" onClick={handleClick}>
        Import RAW Files
      </button>
    </div>
  )
}
