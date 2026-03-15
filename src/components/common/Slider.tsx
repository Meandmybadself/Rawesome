import { useCallback, useRef } from 'react'
import type { SliderConfig } from '../../types'
import './Slider.css'

interface SliderProps {
  config: SliderConfig
  value: number
  onChange: (value: number) => void
  onCommit: () => void
}

export function Slider({ config, value, onChange, onCommit }: SliderProps) {
  const isInteracting = useRef(false)

  const handleInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    onChange(parseFloat((e.target as HTMLInputElement).value))
  }, [onChange])

  const handlePointerDown = useCallback(() => {
    isInteracting.current = true
  }, [])

  const handlePointerUp = useCallback(() => {
    if (isInteracting.current) {
      isInteracting.current = false
      onCommit()
    }
  }, [onCommit])

  const handleDoubleClick = useCallback(() => {
    onChange(config.defaultValue)
    onCommit()
  }, [onChange, onCommit, config.defaultValue])

  const handleReset = useCallback(() => {
    onChange(config.defaultValue)
    onCommit()
  }, [onChange, onCommit, config.defaultValue])

  const displayValue = config.step < 1 ? value.toFixed(2) : Math.round(value).toString()
  const isModified = value !== config.defaultValue

  return (
    <div className="slider">
      <div className="slider__header">
        <label className="slider__label">{config.label}</label>
        <div className="slider__header-right">
          <span className="slider__value">{displayValue}</span>
          {isModified && (
            <button className="slider__reset" onClick={handleReset} aria-label={`Reset ${config.label}`}>
              &times;
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min={config.min}
        max={config.max}
        step={config.step}
        value={value}
        onInput={handleInput}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        aria-label={config.label}
      />
    </div>
  )
}
