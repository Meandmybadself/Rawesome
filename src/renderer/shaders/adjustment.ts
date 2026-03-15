export const ADJUSTMENT_VERT = /* glsl */`#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_uv;

out vec2 v_uv;

void main() {
  v_uv = a_uv;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

export const ADJUSTMENT_FRAG = /* glsl */`#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_texture;

uniform float u_exposure;
uniform mat3 u_wbMatrix;
uniform float u_contrast;
uniform float u_highlights;
uniform float u_shadows;
uniform float u_whites;
uniform float u_blacks;
uniform float u_clarity;
uniform float u_vibrance;
uniform float u_saturation;

float luminance(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

// sRGB decode: gamma-encoded [0,1] → linear light [0,1]
float sRGBToLinear(float x) {
  return x <= 0.04045
    ? x / 12.92
    : pow((x + 0.055) / 1.055, 2.4);
}

vec3 sRGBToLinearV(vec3 c) {
  return vec3(sRGBToLinear(c.r), sRGBToLinear(c.g), sRGBToLinear(c.b));
}

// sRGB encode: linear light [0,1] → gamma-encoded [0,1]
float linearToSRGB(float x) {
  x = clamp(x, 0.0, 1.0);
  return x <= 0.0031308
    ? 12.92 * x
    : 1.055 * pow(x, 1.0 / 2.4) - 0.055;
}

vec3 linearToSRGBv(vec3 c) {
  return vec3(linearToSRGB(c.r), linearToSRGB(c.g), linearToSRGB(c.b));
}

// Attempt to preserve the color ratio when adjusting luminance.
// Instead of adding a flat offset (which desaturates), scale RGB
// so that the new luminance matches the target while keeping hue.
vec3 adjustLuminance(vec3 c, float oldLum, float newLum) {
  if (oldLum < 0.001) return vec3(newLum); // pure black → grey
  return c * (newLum / oldLum);
}

vec3 applyContrast(vec3 c, float strength) {
  if (abs(strength) < 0.001) return c;
  // S-curve contrast around 0.5 using a power function
  // Positive = more contrast, negative = less
  float lum = luminance(c);
  float t = clamp(lum, 0.0, 1.0);
  float newLum;
  if (strength > 0.0) {
    // Increase contrast: steepen around midpoint
    float gamma = 1.0 / (1.0 + strength * 2.0);
    newLum = t < 0.5
      ? 0.5 * pow(2.0 * t, 1.0 / gamma)
      : 1.0 - 0.5 * pow(2.0 * (1.0 - t), 1.0 / gamma);
  } else {
    // Decrease contrast: flatten
    float gamma = 1.0 + abs(strength) * 2.0;
    newLum = t < 0.5
      ? 0.5 * pow(2.0 * t, 1.0 / gamma)
      : 1.0 - 0.5 * pow(2.0 * (1.0 - t), 1.0 / gamma);
  }
  return clamp(adjustLuminance(c, lum, newLum), 0.0, 1.0);
}

// Highlights: compress or expand the upper tonal range.
// In linear light, middle grey (~sRGB 0.5) is around 0.18–0.22.
// "Bright" pixels in linear are roughly > 0.15.
// Negative strength pulls bright values toward midtones.
// Positive strength pushes them toward white.
vec3 applyHighlights(vec3 c, float strength) {
  if (abs(strength) < 0.001) return c;
  float lum = luminance(c);
  float t = clamp(lum, 0.0, 1.0);

  // Mask: targets the upper range, feathered.
  // In linear light, 0.1 ≈ sRGB 0.35, 0.5 ≈ sRGB 0.74
  float mask = smoothstep(0.1, 0.5, t);

  // Scale the effect so it's stronger on brighter pixels
  float weight = mask * t; // brighter pixels get more effect

  float targetLum;
  if (strength < 0.0) {
    // Pull highlights down: blend toward a compressed value
    // At strength=-1, t=0.9 → target ≈ 0.9 - 0.9*0.9*0.55 ≈ 0.455
    targetLum = t + strength * weight * 0.55;
  } else {
    // Push highlights up: expand toward 1.0
    targetLum = t + strength * mask * (1.0 - t) * 0.7;
  }
  targetLum = clamp(targetLum, 0.0, 1.0);

  return clamp(adjustLuminance(c, lum, targetLum), 0.0, 1.0);
}

// Shadows: lift or crush the lower tonal range.
// Negative strength crushes darks deeper.
// Positive strength lifts shadows to reveal detail.
vec3 applyShadows(vec3 c, float strength) {
  if (abs(strength) < 0.001) return c;
  float lum = luminance(c);
  float t = clamp(lum, 0.0, 1.0);

  // Mask: targets the lower range.
  // In linear: 0.3 ≈ sRGB 0.58, 0.05 ≈ sRGB 0.24
  float mask = 1.0 - smoothstep(0.0, 0.35, t);

  float targetLum;
  if (strength > 0.0) {
    // Lift shadows: use a gamma curve to open up darks
    // Higher exponent = more lift in deep shadows
    float gamma = 1.0 / (1.0 + strength * 2.0);
    float lifted = pow(t, gamma);
    targetLum = mix(t, lifted, mask);
  } else {
    // Crush shadows: push darks deeper
    float gamma = 1.0 + abs(strength) * 2.5;
    float crushed = pow(t, gamma);
    targetLum = mix(t, crushed, mask);
  }
  targetLum = clamp(targetLum, 0.0, 1.0);

  return clamp(adjustLuminance(c, lum, targetLum), 0.0, 1.0);
}

// Whites: endpoint adjustment for the brightest pixels.
// Narrower range than highlights.
vec3 applyWhites(vec3 c, float strength) {
  if (abs(strength) < 0.001) return c;
  float lum = luminance(c);
  float t = clamp(lum, 0.0, 1.0);
  // In linear: 0.4 ≈ sRGB 0.66, 0.8 ≈ sRGB 0.91
  float mask = smoothstep(0.4, 0.8, t);
  float targetLum = t + strength * mask * 0.4;
  targetLum = clamp(targetLum, 0.0, 1.0);
  return clamp(adjustLuminance(c, lum, targetLum), 0.0, 1.0);
}

// Blacks: endpoint adjustment for the darkest pixels.
// Narrower range than shadows.
vec3 applyBlacks(vec3 c, float strength) {
  if (abs(strength) < 0.001) return c;
  float lum = luminance(c);
  float t = clamp(lum, 0.0, 1.0);
  // In linear: 0.15 ≈ sRGB 0.42
  float mask = 1.0 - smoothstep(0.0, 0.15, t);
  float targetLum = t + strength * mask * 0.3;
  targetLum = clamp(targetLum, 0.0, 1.0);
  return clamp(adjustLuminance(c, lum, targetLum), 0.0, 1.0);
}

vec3 applyClarity(vec3 c, vec2 uv, float strength) {
  if (abs(strength) < 0.001) return c;
  // Approximate local contrast via 5-tap cross blur
  vec2 texelSize = 1.0 / vec2(textureSize(u_texture, 0));
  vec2 offset = texelSize * 4.0; // 4-pixel radius
  vec3 blurred = texture(u_texture, uv).rgb * 0.2
    + texture(u_texture, uv + vec2(offset.x, 0.0)).rgb * 0.2
    + texture(u_texture, uv - vec2(offset.x, 0.0)).rgb * 0.2
    + texture(u_texture, uv + vec2(0.0, offset.y)).rgb * 0.2
    + texture(u_texture, uv - vec2(0.0, offset.y)).rgb * 0.2;
  vec3 detail = c - blurred;
  float lum = luminance(c);
  float midtoneMask = sin(clamp(lum, 0.0, 1.0) * 3.14159);
  return clamp(c + detail * strength * 0.6 * midtoneMask, 0.0, 1.0);
}

vec3 applySaturation(vec3 c, float strength) {
  if (abs(strength) < 0.001) return c;
  float lum = luminance(c);
  return clamp(mix(vec3(lum), c, 1.0 + strength), 0.0, 1.0);
}

vec3 applyVibrance(vec3 c, float strength) {
  if (abs(strength) < 0.001) return c;
  float lum = luminance(c);
  float cMax = max(c.r, max(c.g, c.b));
  float cMin = min(c.r, min(c.g, c.b));
  float chroma = cMax - cMin;
  float satProtect = 1.0 - chroma;
  float skinMask = 0.0;
  if (c.r > c.g && c.g > c.b && chroma > 0.05) {
    float hueRatio = (c.r - c.g) / (chroma + 0.0001);
    skinMask = smoothstep(0.25, 0.45, hueRatio) * (1.0 - smoothstep(0.65, 0.85, hueRatio));
    skinMask *= smoothstep(0.03, 0.15, chroma);
  }
  float effective = strength * satProtect * (1.0 - skinMask * 0.7);
  return clamp(mix(vec3(lum), c, 1.0 + effective), 0.0, 1.0);
}

void main() {
  vec4 sample_ = texture(u_texture, v_uv);
  vec3 c = sample_.rgb;

  // 0. Input is sRGB gamma-encoded from libraw (outputBps:8) — linearize first
  c = sRGBToLinearV(c);

  // 1. White balance (Bradford CAT matrix, operates in linear light)
  c = u_wbMatrix * c;
  c = max(c, vec3(0.0));

  // 2. Exposure (in linear light — multiply by 2^stops)
  c *= pow(2.0, u_exposure);

  // 3. Highlights, shadows, whites, blacks
  c = applyHighlights(c, u_highlights);
  c = applyShadows(c, u_shadows);
  c = applyWhites(c, u_whites);
  c = applyBlacks(c, u_blacks);

  // 4. Contrast
  c = applyContrast(c, u_contrast);

  // 5. Clarity
  c = applyClarity(c, v_uv, u_clarity);

  // 6. Saturation and vibrance
  c = applySaturation(c, u_saturation);
  c = applyVibrance(c, u_vibrance);

  // 7. Re-encode to sRGB gamma
  c = linearToSRGBv(c);

  fragColor = vec4(c, 1.0);
}
`
