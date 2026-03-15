/// <reference lib="webworker" />
import type { EncodeRequest, EncodeWorkerMessage } from '../types'

self.onmessage = async (event: MessageEvent<EncodeRequest>) => {
  const msg = event.data
  if (msg.type !== 'ENCODE') return

  const { id, pixels: pixelBuffer, width, height, format, quality } = msg

  const postProgress = (phase: string, percent: number) => {
    const response: EncodeWorkerMessage = { type: 'ENCODE_PROGRESS', id, phase, percent }
    self.postMessage(response)
  }

  try {
    const floatPixels = new Float32Array(pixelBuffer)

    if (format === 'jpeg') {
      postProgress('preparing', 10)

      // Convert RGB float to RGBA uint8 for canvas
      const pixelCount = width * height
      const rgba = new Uint8ClampedArray(pixelCount * 4)
      for (let i = 0; i < pixelCount; i++) {
        rgba[i * 4] = Math.round(Math.min(1, Math.max(0, floatPixels[i * 3])) * 255)
        rgba[i * 4 + 1] = Math.round(Math.min(1, Math.max(0, floatPixels[i * 3 + 1])) * 255)
        rgba[i * 4 + 2] = Math.round(Math.min(1, Math.max(0, floatPixels[i * 3 + 2])) * 255)
        rgba[i * 4 + 3] = 255
      }

      postProgress('encoding', 50)

      const canvas = new OffscreenCanvas(width, height)
      const ctx = canvas.getContext('2d')!
      ctx.putImageData(new ImageData(rgba, width, height), 0, 0)

      const blob = await canvas.convertToBlob({
        type: 'image/jpeg',
        quality: quality ?? 0.92,
      })

      postProgress('done', 100)

      const response: EncodeWorkerMessage = {
        type: 'ENCODE_SUCCESS',
        id,
        blob,
        byteLength: blob.size,
      }
      self.postMessage(response)

    } else if (format === 'png') {
      postProgress('encoding', 30)

      // Use OffscreenCanvas for PNG too — simpler and sufficient for 8-bit
      const pixelCount = width * height
      const rgba = new Uint8ClampedArray(pixelCount * 4)
      for (let i = 0; i < pixelCount; i++) {
        rgba[i * 4] = Math.round(Math.min(1, Math.max(0, floatPixels[i * 3])) * 255)
        rgba[i * 4 + 1] = Math.round(Math.min(1, Math.max(0, floatPixels[i * 3 + 1])) * 255)
        rgba[i * 4 + 2] = Math.round(Math.min(1, Math.max(0, floatPixels[i * 3 + 2])) * 255)
        rgba[i * 4 + 3] = 255
      }

      const canvas = new OffscreenCanvas(width, height)
      const ctx = canvas.getContext('2d')!
      ctx.putImageData(new ImageData(rgba, width, height), 0, 0)

      const blob = await canvas.convertToBlob({ type: 'image/png' })

      postProgress('done', 100)

      const response: EncodeWorkerMessage = {
        type: 'ENCODE_SUCCESS',
        id,
        blob,
        byteLength: blob.size,
      }
      self.postMessage(response)
    }
  } catch (err: unknown) {
    const response: EncodeWorkerMessage = {
      type: 'ENCODE_ERROR',
      id,
      message: err instanceof Error ? err.message : String(err),
    }
    self.postMessage(response)
  }
}
