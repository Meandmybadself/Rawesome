export const GEOMETRY_VERT = /* glsl */`#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_uv;

out vec2 v_uv;

uniform vec4 u_cropRect;  // x, y, width, height in [0,1]
uniform float u_rotation; // radians
uniform vec2 u_flip;      // x=flipH, y=flipV (0 or 1)

void main() {
  // Flip Y to convert from WebGL (Y-up) to image (Y-down) coordinates
  vec2 uv = vec2(a_uv.x, 1.0 - a_uv.y);

  if (u_flip.x > 0.5) uv.x = 1.0 - uv.x;
  if (u_flip.y > 0.5) uv.y = 1.0 - uv.y;

  uv = u_cropRect.xy + uv * u_cropRect.zw;

  if (abs(u_rotation) > 0.0001) {
    vec2 center = u_cropRect.xy + u_cropRect.zw * 0.5;
    vec2 offset = uv - center;
    float cosR = cos(-u_rotation);
    float sinR = sin(-u_rotation);
    offset = vec2(
      offset.x * cosR - offset.y * sinR,
      offset.x * sinR + offset.y * cosR
    );
    uv = center + offset;
  }

  v_uv = uv;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

export const GEOMETRY_FRAG = /* glsl */`#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_texture;

void main() {
  vec2 uv = clamp(v_uv, 0.0, 1.0);
  fragColor = texture(u_texture, uv);
}
`
