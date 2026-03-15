// Bradford chromatic adaptation transform
// Converts temperature + tint sliders to a 3x3 color matrix in sRGB space

const BRADFORD = [
  0.8951,  0.2664, -0.1614,
 -0.7502,  1.7135,  0.0367,
  0.0389, -0.0685,  1.0296,
]

const BRADFORD_INV = [
  0.9869929, -0.1470543,  0.1599627,
  0.4323053,  0.5183603,  0.0492912,
 -0.0085287,  0.0400428,  0.9684867,
]

const SRGB_TO_XYZ = [
  0.4124564, 0.3575761, 0.1804375,
  0.2126729, 0.7151522, 0.0721750,
  0.0193339, 0.1191920, 0.9503041,
]

const XYZ_TO_SRGB = [
   3.2404542, -1.5371385, -0.4985314,
  -0.9692660,  1.8760108,  0.0415560,
   0.0556434, -0.2040259,  1.0572252,
]

function kelvinToXY(K: number): [number, number] {
  let x: number
  if (K <= 4000) {
    x = -0.2661239e9 / (K * K * K) - 0.2343580e6 / (K * K) + 0.8776956e3 / K + 0.179910
  } else {
    x = -3.0258469e9 / (K * K * K) + 2.1070379e6 / (K * K) + 0.2226347e3 / K + 0.240390
  }
  let y: number
  if (K <= 2222) {
    y = -1.1063814 * x * x * x - 1.34811020 * x * x + 2.18555832 * x - 0.20219683
  } else if (K <= 4000) {
    y = -0.9549476 * x * x * x - 1.37418593 * x * x + 2.09137015 * x - 0.16748867
  } else {
    y = 3.0817580 * x * x * x - 5.87338670 * x * x + 3.75112997 * x - 0.37001483
  }
  return [x, y]
}

function xyToXYZ(x: number, y: number): [number, number, number] {
  return [x / y, 1.0, (1 - x - y) / y]
}

function mat3Mul(a: number[], b: number[]): number[] {
  const c = new Array(9).fill(0)
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < 3; k++)
        c[i * 3 + j] += a[i * 3 + k] * b[k * 3 + j]
  return c
}

function mat3MulVec(m: number[], v: [number, number, number]): [number, number, number] {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ]
}

// Returns Float32Array(9) in column-major order for gl.uniformMatrix3fv
export function temperatureToMatrix(kelvin: number, tint: number): Float32Array {
  const clampedK = Math.max(1667, Math.min(25000, kelvin))

  // Source white: D65 (6504K, sRGB reference)
  const [sx, sy] = kelvinToXY(6504)
  const srcXYZ = xyToXYZ(sx, sy)

  // Destination white: target temperature
  const [dx, dy] = kelvinToXY(clampedK)
  const dstXYZ = xyToXYZ(dx, dy)

  // Tint as green-magenta shift in LMS
  const tintShift = 1.0 + (tint / 150.0) * 0.2

  const srcLMS = mat3MulVec(BRADFORD, srcXYZ)
  const dstLMS = mat3MulVec(BRADFORD, dstXYZ)

  const scale = [
    dstLMS[0] / srcLMS[0],
    (dstLMS[1] / srcLMS[1]) * tintShift,
    dstLMS[2] / srcLMS[2],
  ]

  const scaleMat = [
    scale[0], 0, 0,
    0, scale[1], 0,
    0, 0, scale[2],
  ]

  const adaptXYZ = mat3Mul(BRADFORD_INV, mat3Mul(scaleMat, BRADFORD))
  const final = mat3Mul(XYZ_TO_SRGB, mat3Mul(adaptXYZ, SRGB_TO_XYZ))

  // Column-major for WebGL
  return new Float32Array([
    final[0], final[3], final[6],
    final[1], final[4], final[7],
    final[2], final[5], final[8],
  ])
}
