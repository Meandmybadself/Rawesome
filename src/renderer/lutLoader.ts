export async function loadHaldCLUT(url: string): Promise<Uint8Array> {
  const img = new Image()
  img.crossOrigin = 'anonymous'

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to load LUT: ${url}`))
    img.src = url
  })

  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  const imageData = ctx.getImageData(0, 0, img.width, img.height)
  const pixels = imageData.data // RGBA Uint8ClampedArray

  // Determine LUT size: for a HaldCLUT, total pixels = lutSize^3
  // A 512x512 image has 262144 pixels = 64^3, so lutSize = 64
  const totalPixels = img.width * img.height
  const lutSize = Math.round(Math.pow(totalPixels, 1 / 3))

  if (lutSize * lutSize * lutSize !== totalPixels) {
    throw new Error(`Invalid HaldCLUT dimensions: ${img.width}x${img.height}`)
  }

  // Convert from 2D Hald layout to linear 3D array (RGB only, no alpha)
  // In a HaldCLUT, pixels are stored in R-G-B order (R varies fastest, then G, then B).
  // So pixel index i maps to:
  // r = i % lutSize
  // g = (i / lutSize) % lutSize
  // b = (i / (lutSize * lutSize)) % lutSize
  // And the pixel at that index gives the output color for input (r,g,b)/lutSize.

  const data = new Uint8Array(lutSize * lutSize * lutSize * 3)

  for (let i = 0; i < totalPixels; i++) {
    const r = i % lutSize
    const g = Math.floor(i / lutSize) % lutSize
    const b = Math.floor(i / (lutSize * lutSize))

    // Map from linear pixel index to 2D image coordinates
    const imgX = i % img.width
    const imgY = Math.floor(i / img.width)
    const srcIdx = (imgY * img.width + imgX) * 4

    // Write to 3D array in R,G,B order for texImage3D
    const dstIdx = (b * lutSize * lutSize + g * lutSize + r) * 3
    data[dstIdx] = pixels[srcIdx]       // R
    data[dstIdx + 1] = pixels[srcIdx + 1] // G
    data[dstIdx + 2] = pixels[srcIdx + 2] // B
  }

  return data
}

export function createLutTexture(
  gl: WebGL2RenderingContext,
  data: Uint8Array,
  size: number,
): WebGLTexture {
  const tex = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_3D, tex)
  gl.texImage3D(
    gl.TEXTURE_3D, 0, gl.RGB8,
    size, size, size, 0,
    gl.RGB, gl.UNSIGNED_BYTE, data,
  )
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE)
  gl.bindTexture(gl.TEXTURE_3D, null)
  return tex
}
