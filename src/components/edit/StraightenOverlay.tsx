import { useRef, useState, useCallback } from 'react'
import { useEditStore } from '../../stores/editStore'
import { useUIStore } from '../../stores/uiStore'
import './StraightenOverlay.css'

interface LinePoints {
  x1: number
  y1: number
  x2: number
  y2: number
}

function computeCorrection(line: LinePoints): number {
  const dx = line.x2 - line.x1
  const dy = -(line.y2 - line.y1) // negate for screen-space Y-down -> math Y-up
  const lineAngle = Math.atan2(dy, dx) * (180 / Math.PI) // degrees

  let correction: number
  if (Math.abs(lineAngle) <= 45) {
    // More horizontal -> rotate to make horizontal
    correction = -lineAngle
  } else {
    // More vertical -> rotate to make vertical
    correction = -(lineAngle - Math.sign(lineAngle) * 90)
  }

  // Clamp to +/-45
  return Math.max(-45, Math.min(45, correction))
}

export function StraightenOverlay() {
  const straightenActive = useUIStore((s) => s.straightenActive)
  if (!straightenActive) return null
  return <StraightenOverlayInner />
}

function StraightenOverlayInner() {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [line, setLine] = useState<LinePoints | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [correction, setCorrection] = useState<number | null>(null)

  const crop = useEditStore((s) => s.params.crop)
  const setParam = useEditStore((s) => s.setParam)
  const commitSnapshot = useEditStore((s) => s.commitSnapshot)
  const setStraightenActive = useUIStore((s) => s.setStraightenActive)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (correction !== null) return // Already have a line, waiting for apply/cancel
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    const rect = overlayRef.current!.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setLine({ x1: x, y1: y, x2: x, y2: y })
    setDrawing(true)
    setCorrection(null)
  }, [correction])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!drawing || !overlayRef.current) return
    const rect = overlayRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setLine((prev) => prev ? { ...prev, x2: x, y2: y } : null)
  }, [drawing])

  const handlePointerUp = useCallback(() => {
    if (!drawing || !line) return
    setDrawing(false)
    const len = Math.hypot(line.x2 - line.x1, line.y2 - line.y1)
    if (len < 20) {
      setLine(null)
      return
    }
    setCorrection(computeCorrection(line))
  }, [drawing, line])

  const handleApply = useCallback(() => {
    if (correction === null) return
    const newAngle = Math.max(-45, Math.min(45, crop.angle + correction))
    setParam('crop', { ...crop, angle: newAngle })
    commitSnapshot()
    setLine(null)
    setCorrection(null)
    setStraightenActive(false)
  }, [correction, crop, setParam, commitSnapshot, setStraightenActive])

  const handleCancel = useCallback(() => {
    setLine(null)
    setCorrection(null)
    setStraightenActive(false)
  }, [setStraightenActive])

  return (
    <div
      className="straighten-overlay"
      ref={overlayRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {line && (
        <svg className="straighten-overlay__svg">
          <line
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#ff6b35"
            strokeWidth={2}
            strokeDasharray="6 3"
          />
          <circle cx={line.x1} cy={line.y1} r={4} fill="#ff6b35" />
          <circle cx={line.x2} cy={line.y2} r={4} fill="#ff6b35" />
        </svg>
      )}
      {correction !== null && (
        <div className="straighten-overlay__actions">
          <span className="straighten-overlay__label">
            {correction >= 0 ? '+' : ''}{correction.toFixed(1)}°
          </span>
          <button className="straighten-overlay__btn straighten-overlay__btn--apply" onClick={handleApply}>
            Apply
          </button>
          <button className="straighten-overlay__btn straighten-overlay__btn--cancel" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
