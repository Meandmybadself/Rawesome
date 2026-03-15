import { useEditStore } from '../../stores/editStore'
import { useUIStore } from '../../stores/uiStore'
import { EXPOSURE_SLIDERS, COLOR_SLIDERS, WB_PRESETS } from '../../lib/constants'
import { Slider } from '../common/Slider'
import type { SliderConfig } from '../../types'
import './AdjustmentPanel.css'

function SliderGroup({ sliders }: { sliders: SliderConfig[] }) {
  const params = useEditStore((s) => s.params)
  const setParam = useEditStore((s) => s.setParam)
  const commitSnapshot = useEditStore((s) => s.commitSnapshot)

  return (
    <>
      {sliders.map((config) => (
        <Slider
          key={config.key}
          config={config}
          value={params[config.key] as number}
          onChange={(v) => setParam(config.key, v)}
          onCommit={commitSnapshot}
        />
      ))}
    </>
  )
}

function WhiteBalancePresets() {
  const setParams = useEditStore((s) => s.setParams)
  const commitSnapshot = useEditStore((s) => s.commitSnapshot)

  return (
    <div className="wb-presets">
      {WB_PRESETS.map((preset) => (
        <button
          key={preset.label}
          className="wb-presets__btn"
          onClick={() => {
            setParams({ temperature: preset.temperature, tint: preset.tint })
            commitSnapshot()
          }}
        >
          {preset.label}
        </button>
      ))}
    </div>
  )
}

export function AdjustmentPanel() {
  const activeTool = useUIStore((s) => s.activeTool)
  const setActiveTool = useUIStore((s) => s.setActiveTool)
  const resetToDefaults = useEditStore((s) => s.resetToDefaults)

  return (
    <aside className="adjustment-panel">
      <div className="adjustment-panel__tools">
        <button
          className={`tool-btn ${activeTool === 'adjust' ? 'tool-btn--active' : ''}`}
          onClick={() => setActiveTool('adjust')}
        >
          Adjust
        </button>
        <button
          className={`tool-btn ${activeTool === 'crop' ? 'tool-btn--active' : ''}`}
          onClick={() => setActiveTool('crop')}
        >
          Crop
        </button>
      </div>

      {activeTool === 'adjust' && (
        <div className="adjustment-panel__sliders">
          <div className="panel-section">
            <h3 className="panel-section__title">Light</h3>
            <SliderGroup sliders={EXPOSURE_SLIDERS} />
          </div>

          <div className="panel-section">
            <h3 className="panel-section__title">Color</h3>
            <WhiteBalancePresets />
            <SliderGroup sliders={COLOR_SLIDERS} />
          </div>

          <div className="panel-section">
            <button className="reset-btn" onClick={resetToDefaults}>
              Reset All
            </button>
          </div>
        </div>
      )}

      {activeTool === 'crop' && (
        <div className="adjustment-panel__crop">
          <CropControls />
        </div>
      )}
    </aside>
  )
}

function CropControls() {
  const crop = useEditStore((s) => s.params.crop)
  const setParam = useEditStore((s) => s.setParam)
  const commitSnapshot = useEditStore((s) => s.commitSnapshot)
  const setActiveTool = useUIStore((s) => s.setActiveTool)

  return (
    <div className="panel-section">
      <h3 className="panel-section__title">Crop & Rotate</h3>
      <button
        className="done-btn"
        onClick={() => setActiveTool('adjust')}
      >
        Done
      </button>
      <div className="slider">
        <div className="slider__header">
          <label className="slider__label">Rotation</label>
          <span className="slider__value">{crop.angle.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={-45}
          max={45}
          step={0.1}
          value={crop.angle}
          onInput={(e) => setParam('crop', { ...crop, angle: parseFloat((e.target as HTMLInputElement).value) })}
          onPointerUp={commitSnapshot}
          onDoubleClick={() => { setParam('crop', { ...crop, angle: 0 }); commitSnapshot() }}
          aria-label="Rotation"
        />
      </div>
      <button
        className="reset-btn"
        onClick={() => {
          setParam('crop', { x: 0, y: 0, width: 1, height: 1, angle: 0, quarterTurns: 0 })
          commitSnapshot()
        }}
      >
        Reset Crop
      </button>
    </div>
  )
}
