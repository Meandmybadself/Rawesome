// ─── Edit Parameters ──────────────────────────────────────────────────────────

export interface EditParams {
  exposure: number       // stops, -5.0 to +5.0
  highlights: number     // -100 to +100
  shadows: number        // -100 to +100
  whites: number         // -100 to +100
  blacks: number         // -100 to +100
  contrast: number       // -100 to +100
  clarity: number        // -100 to +100
  temperature: number    // 2000–50000 K
  tint: number           // -150 to +150
  vibrance: number       // -100 to +100
  saturation: number     // -100 to +100
  crop: CropRect
  film?: {
    presetId: string | null
    strength: number
  }
}

export interface CropRect {
  x: number       // normalized [0, 1]
  y: number
  width: number
  height: number
  angle: number   // degrees, -45 to +45
  quarterTurns?: number  // 0-3: number of 90° CW rotations
}

export const DEFAULT_EDIT_PARAMS: EditParams = {
  exposure: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  contrast: 0,
  clarity: 0,
  temperature: 6504,
  tint: 0,
  vibrance: 0,
  saturation: 0,
  crop: { x: 0, y: 0, width: 1, height: 1, angle: 0, quarterTurns: 0 },
  film: { presetId: null, strength: 100 },
}

// ─── File Registry ────────────────────────────────────────────────────────────

export type FileId = string

export interface CatalogEntry {
  id: FileId
  originalName: string
  fileSize: number
  importedAt: number
  editedAt: number
  width: number | null
  height: number | null
  thumbnailReady: boolean
}

// ─── UI ───────────────────────────────────────────────────────────────────────

export type AppView = 'library' | 'edit'
export type ActiveTool = 'adjust' | 'crop' | 'film'
export type Theme = 'dark' | 'light'

// ─── White Balance Presets ────────────────────────────────────────────────────

export interface WBPreset {
  label: string
  temperature: number
  tint: number
}

// ─── Slider Config ────────────────────────────────────────────────────────────

export interface SliderConfig {
  key: keyof Omit<EditParams, 'crop' | 'film'>
  label: string
  min: number
  max: number
  step: number
  defaultValue: number
}

export interface FilmPreset {
  id: string
  name: string
  category: string
  bundled: boolean
  lutUrl: string
}

// ─── RAW Metadata ─────────────────────────────────────────────────────────────

export interface RawMetadata {
  width: number
  height: number
  make: string
  model: string
  iso: number
  shutterSpeed: number
  aperture: number
  focalLength: number
  timestamp: number
}

// ─── Worker Protocol ──────────────────────────────────────────────────────────

export interface DecodeRequest {
  type: 'DECODE'
  id: string
  buffer: ArrayBuffer
  halfSize?: boolean
}

export interface DecodeSuccessResponse {
  type: 'DECODE_SUCCESS'
  id: string
  pixels: ArrayBuffer  // Float32Array RGB [0,1]
  width: number
  height: number
  metadata: RawMetadata
}

export interface DecodeProgressResponse {
  type: 'DECODE_PROGRESS'
  id: string
  phase: string
  percent: number
}

export interface DecodeErrorResponse {
  type: 'DECODE_ERROR'
  id: string
  code: 'UNSUPPORTED_FORMAT' | 'CORRUPT_FILE' | 'OUT_OF_MEMORY' | 'UNKNOWN'
  message: string
}

export type DecodeWorkerMessage = DecodeSuccessResponse | DecodeProgressResponse | DecodeErrorResponse

export interface EncodeRequest {
  type: 'ENCODE'
  id: string
  pixels: ArrayBuffer
  width: number
  height: number
  format: 'jpeg' | 'png'
  quality?: number
}

export interface EncodeSuccessResponse {
  type: 'ENCODE_SUCCESS'
  id: string
  blob: Blob
  byteLength: number
}

export interface EncodeProgressResponse {
  type: 'ENCODE_PROGRESS'
  id: string
  phase: string
  percent: number
}

export interface EncodeErrorResponse {
  type: 'ENCODE_ERROR'
  id: string
  message: string
}

export type EncodeWorkerMessage = EncodeSuccessResponse | EncodeProgressResponse | EncodeErrorResponse
