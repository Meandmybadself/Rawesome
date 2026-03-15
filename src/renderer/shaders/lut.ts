export const LUT_FRAG = /* glsl */`#version 300 es
precision highp float;
precision highp sampler3D;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_texture;
uniform sampler3D u_lut;
uniform float u_strength;

void main() {
  vec3 color = texture(u_texture, v_uv).rgb;
  // Clamp to [0,1] for safe LUT lookup
  vec3 lutCoord = clamp(color, 0.0, 1.0);
  vec3 graded = texture(u_lut, lutCoord).rgb;
  fragColor = vec4(mix(color, graded, u_strength), 1.0);
}
`
