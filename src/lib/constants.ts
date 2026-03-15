import type { WBPreset, SliderConfig } from '../types'

export const WB_PRESETS: WBPreset[] = [
  { label: 'Daylight',    temperature: 5500, tint: 0 },
  { label: 'Cloudy',      temperature: 6500, tint: 10 },
  { label: 'Tungsten',    temperature: 3200, tint: -10 },
  { label: 'Flash',       temperature: 5500, tint: 8 },
  { label: 'Fluorescent', temperature: 4000, tint: -20 },
]

export const EXPOSURE_SLIDERS: SliderConfig[] = [
  { key: 'exposure',   label: 'Exposure',   min: -5,   max: 5,   step: 0.05, defaultValue: 0 },
  { key: 'contrast',   label: 'Contrast',   min: -100, max: 100, step: 1,    defaultValue: 0 },
  { key: 'highlights', label: 'Highlights', min: -100, max: 100, step: 1,    defaultValue: 0 },
  { key: 'shadows',    label: 'Shadows',    min: -100, max: 100, step: 1,    defaultValue: 0 },
  { key: 'whites',     label: 'Whites',     min: -100, max: 100, step: 1,    defaultValue: 0 },
  { key: 'blacks',     label: 'Blacks',     min: -100, max: 100, step: 1,    defaultValue: 0 },
  { key: 'clarity',    label: 'Clarity',    min: -100, max: 100, step: 1,    defaultValue: 0 },
]

export const COLOR_SLIDERS: SliderConfig[] = [
  { key: 'temperature', label: 'Temp',       min: 2000, max: 50000, step: 100, defaultValue: 6504 },
  { key: 'tint',        label: 'Tint',       min: -150, max: 150,   step: 1,   defaultValue: 0 },
  { key: 'vibrance',    label: 'Vibrance',   min: -100, max: 100,   step: 1,   defaultValue: 0 },
  { key: 'saturation',  label: 'Saturation', min: -100, max: 100,   step: 1,   defaultValue: 0 },
]

export const RAW_EXTENSIONS = new Set([
  '.cr2', '.cr3', '.nef', '.nrw', '.arw', '.srf', '.sr2',
  '.dng', '.raf', '.orf', '.rw2', '.pef', '.srw', '.x3f',
  '.3fr', '.fff', '.iiq', '.rwl', '.mrw', '.mdc', '.dcr',
])
