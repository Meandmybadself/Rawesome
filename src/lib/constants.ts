import type { WBPreset, SliderConfig, FilmPreset } from '../types'

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

export const FILM_PRESETS: FilmPreset[] = [
  // Kodak Color
  { id: 'kodak-portra-160', name: 'Portra 160', category: 'Kodak', bundled: true, lutUrl: '/luts/kodak-portra-160.png' },
  { id: 'kodak-portra-400', name: 'Portra 400', category: 'Kodak', bundled: true, lutUrl: '/luts/kodak-portra-400.png' },
  { id: 'kodak-ektar-100', name: 'Ektar 100', category: 'Kodak', bundled: true, lutUrl: '/luts/kodak-ektar-100.png' },
  { id: 'kodak-kodachrome-64', name: 'Kodachrome 64', category: 'Kodak', bundled: true, lutUrl: '/luts/kodak-kodachrome-64.png' },
  // Fuji Color
  { id: 'fuji-velvia-50', name: 'Velvia 50', category: 'Fuji', bundled: true, lutUrl: '/luts/fuji-velvia-50.png' },
  { id: 'fuji-provia-100f', name: 'Provia 100F', category: 'Fuji', bundled: true, lutUrl: '/luts/fuji-provia-100f.png' },
  { id: 'fuji-superia-400', name: 'Superia 400', category: 'Fuji', bundled: true, lutUrl: '/luts/fuji-superia-400.png' },
  { id: 'fuji-400h', name: '400H', category: 'Fuji', bundled: true, lutUrl: '/luts/fuji-400h.png' },
  // B&W
  { id: 'kodak-tri-x-400', name: 'Tri-X 400', category: 'B&W', bundled: true, lutUrl: '/luts/kodak-tri-x-400.png' },
  { id: 'ilford-hp5', name: 'HP5 Plus 400', category: 'B&W', bundled: true, lutUrl: '/luts/ilford-hp5.png' },
  { id: 'ilford-delta-3200', name: 'Delta 3200', category: 'B&W', bundled: true, lutUrl: '/luts/ilford-delta-3200.png' },
  { id: 'fuji-neopan-acros-100', name: 'Neopan Acros 100', category: 'B&W', bundled: true, lutUrl: '/luts/fuji-neopan-acros-100.png' },
]

export const RAW_EXTENSIONS = new Set([
  '.cr2', '.cr3', '.nef', '.nrw', '.arw', '.srf', '.sr2',
  '.dng', '.raf', '.orf', '.rw2', '.pef', '.srw', '.x3f',
  '.3fr', '.fff', '.iiq', '.rwl', '.mrw', '.mdc', '.dcr',
])
