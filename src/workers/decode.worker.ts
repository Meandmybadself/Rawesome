/// <reference lib="webworker" />
import LibRaw from 'libraw-wasm'
import type { DecodeRequest, DecodeWorkerMessage, RawMetadata } from '../types'

self.onmessage = async (event: MessageEvent<DecodeRequest>) => {
  const msg = event.data
  if (msg.type !== 'DECODE') return

  const { id, buffer, halfSize } = msg

  const postProgress = (phase: string, percent: number) => {
    const response: DecodeWorkerMessage = { type: 'DECODE_PROGRESS', id, phase, percent }
    self.postMessage(response)
  }

  try {
    postProgress('initializing', 5)

    const raw = new LibRaw()
    const fileBytes = new Uint8Array(buffer)

    postProgress('opening', 10)

    // Use outputBps:8 for simpler data handling — the values are gamma-corrected sRGB
    await raw.open(fileBytes, {
      useCameraWb: true,
      outputBps: 8,
      userQual: halfSize ? 0 : 3,
      halfSize: halfSize ?? false,
      outputColor: 1,
      noAutoBright: false,
    })

    postProgress('processing', 40)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawMeta: any = await raw.metadata(false)

    postProgress('reading pixels', 60)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawPixels: any = await raw.imageData()

    postProgress('normalizing', 85)

    const metaWidth: number = rawMeta.width ?? rawMeta.iwidth ?? rawMeta.raw_width ?? 0
    const metaHeight: number = rawMeta.height ?? rawMeta.iheight ?? rawMeta.raw_height ?? 0

    const pixelBytes = extractPixelData(rawPixels, 0)
    const totalPixels = pixelBytes.length / 3  // RGB, 1 byte each

    // metadata reports full-size dimensions even with halfSize: true.
    // Derive actual output dimensions from pixel count + aspect ratio.
    const metaPixels = metaWidth * metaHeight
    let width = metaWidth
    let height = metaHeight
    if (totalPixels > 0 && Math.abs(totalPixels - metaPixels) > metaPixels * 0.01) {
      // Dimensions don't match — likely halfSize mode.
      // Use aspect ratio from metadata to compute actual dims.
      const aspect = metaWidth / metaHeight
      height = Math.round(Math.sqrt(totalPixels / aspect))
      width = Math.round(height * aspect)
    }

    // Convert 8-bit [0,255] to float32 [0,1]
    const floatPixels = new Float32Array(pixelBytes.length)
    const scale = 1 / 255
    for (let i = 0; i < pixelBytes.length; i++) {
      floatPixels[i] = pixelBytes[i] * scale
    }

    postProgress('done', 100)

    const metadata: RawMetadata = {
      width,
      height,
      make: rawMeta.make ?? rawMeta.camera_manufacturer ?? '',
      model: rawMeta.model ?? rawMeta.camera_model ?? '',
      iso: rawMeta.iso_speed ?? rawMeta.isoSpeed ?? 0,
      shutterSpeed: rawMeta.shutter ?? 0,
      aperture: rawMeta.aperture ?? 0,
      focalLength: rawMeta.focal_len ?? rawMeta.focalLength ?? 0,
      timestamp: rawMeta.timestamp instanceof Date ? rawMeta.timestamp.getTime() : (rawMeta.timestamp ?? 0),
    }

    const response: DecodeWorkerMessage = {
      type: 'DECODE_SUCCESS',
      id,
      pixels: floatPixels.buffer,
      width,
      height,
      metadata,
    }

    self.postMessage(response, [floatPixels.buffer])
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const m = message.toLowerCase()
    let code: 'UNSUPPORTED_FORMAT' | 'CORRUPT_FILE' | 'OUT_OF_MEMORY' | 'UNKNOWN' = 'UNKNOWN'
    if (m.includes('unsupported') || m.includes('no decoder')) code = 'UNSUPPORTED_FORMAT'
    else if (m.includes('corrupt') || m.includes('bad file')) code = 'CORRUPT_FILE'
    else if (m.includes('memory') || m.includes('oom')) code = 'OUT_OF_MEMORY'

    const response: DecodeWorkerMessage = { type: 'DECODE_ERROR', id, code, message }
    self.postMessage(response)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPixelData(data: any, expectedLength: number): Uint8Array {
  // Case 1: Already a typed array with valid buffer
  if (data instanceof Uint8Array && data.byteLength > 0) return data
  if (data instanceof ArrayBuffer) return new Uint8Array(data)
  if (ArrayBuffer.isView(data) && data.buffer?.byteLength > 0) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  }

  // Case 2: Plain object from structured clone of embind vector
  // Embind vectors become objects like {0: 128, 1: 64, 2: 200, ...}
  if (data && typeof data === 'object') {
    // Try numeric keys
    const keys = Object.keys(data)
    if (keys.length > 0 && !isNaN(Number(keys[0]))) {
      const len = keys.length
      console.log(`[decode.worker] Reconstructing ${len} bytes from plain object`)
      const arr = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        arr[i] = data[i] ?? data[String(i)] ?? 0
      }
      return arr
    }

    // Try if it has a 'data' or 'buffer' property
    if (data.data) return extractPixelData(data.data, expectedLength)
    if (data.buffer && data.buffer instanceof ArrayBuffer) {
      return new Uint8Array(data.buffer)
    }

    // Log structure for debugging
    const sampleKeys = Object.keys(data).slice(0, 10)
    const sampleVals = sampleKeys.map(k => `${k}:${typeof data[k]}=${data[k]}`)
    throw new Error(
      `Cannot extract pixels from object. Keys(${Object.keys(data).length}): [${sampleVals.join(', ')}]`
    )
  }

  throw new Error(`Unexpected imageData: type=${typeof data}, constructor=${data?.constructor?.name}`)
}
