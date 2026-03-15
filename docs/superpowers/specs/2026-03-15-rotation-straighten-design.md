# Rotation & Straighten Tool Design

## Overview

Add image rotation (90° increments + fine slider) and a straighten tool (draw-a-line-to-level) to the existing crop tool panel in the RAW photo editor.

## Data Model

### CropRect Extension

Add `quarterTurns` field to `CropRect` in `src/types/index.ts`:

```typescript
interface CropRect {
  x: number;       // 0-1 normalized
  y: number;       // 0-1 normalized
  width: number;   // 0-1 normalized
  height: number;  // 0-1 normalized
  angle: number;   // -45 to +45 degrees (fine rotation)
  quarterTurns: number; // 0-3, each representing 90° CW
}
```

Default: `quarterTurns: 0`. Backward-compatible — missing field in saved params treated as 0.

### UI State

Add to `uiStore`:

```typescript
straightenActive: boolean; // Whether straighten line-drawing mode is engaged
```

## UI Layout

Located in the crop tool section of `AdjustmentPanel`. When crop tool is active:

```
Rotation
  [↶]  [——slider——]  [input°]  [↷]
  [Straighten]

[Reset Crop]  [Done]
```

### Controls

- **↶ / ↷ buttons**: Rotate 90° CCW / CW. Modifies `quarterTurns` (mod 4). Commits snapshot on click.
- **Slider**: Range -45 to +45, step 0.1. Controls `angle` (fine rotation). Uses existing `Slider` component pattern.
- **Number input**: Editable field synced with slider, same range. Allows precise angle entry.
- **Straighten button**: Toggles `straightenActive` in uiStore. Highlighted when active.

## Straighten Tool

### Interaction Flow

1. User clicks "Straighten" button → `straightenActive = true`
2. Cursor changes to crosshair over canvas
3. User clicks and drags on image → line drawn as overlay
4. On mouse up → angle calculated, Apply/Cancel buttons appear
5. Apply → rotation applied to `angle`, snapshot committed, straighten mode exits
6. Cancel → line discarded, straighten mode exits, no param changes

### Angle Calculation

```
lineAngle = atan2(dy, dx)  // in radians, convert to degrees

if |lineAngle| <= 45°:
    // Line is more horizontal → rotate to make it horizontal
    correction = -lineAngle

else:
    // Line is more vertical → rotate to make it vertical
    correction = -(lineAngle - sign(lineAngle) * 90°)
```

The correction is applied to the `angle` field (fine rotation). If the resulting angle would exceed ±45°, it's clamped.

### Overlay Implementation

- Rendered as an absolutely-positioned SVG element over the canvas (sibling to `CropOverlay`)
- Thin colored line (e.g., 2px, high-contrast color) from start to end point
- Line coordinates tracked in screen space, translated to image-relative for angle calculation

## Geometry Shader Changes

### New Uniform

```glsl
uniform int u_quarterTurns; // 0-3
```

### Rotation Logic

In the geometry vertex shader:

```glsl
float fineAngle = u_angle; // existing, radians
float totalAngle = fineAngle + float(u_quarterTurns) * (3.14159265 / 2.0);
```

Apply as 2D rotation matrix around crop center (existing pattern).

### Aspect Ratio Handling

When `quarterTurns` is odd (1 or 3), width and height are swapped. The renderer (CPU-side) computes the effective aspect ratio before passing it to the shader, adjusting:

- Canvas/FBO sizing accounts for swapped dimensions
- Crop rect coordinates are interpreted against swapped source dimensions
- The geometry shader's UV scaling compensates for the aspect change

### Crop Mode Interaction

- In crop mode (`renderer.cropMode = true`), the full image is shown with rotation applied
- The crop overlay handles remain functional with rotation
- 90° rotations reset crop to full image (since the frame of reference changes)

## Export & Persistence

- **OPFS**: `quarterTurns` serialized as part of `CropRect` in `params.json`. Missing field defaults to 0 for backward compatibility.
- **Full-res export**: Same geometry pass runs at full resolution — rotation uniforms apply identically.
- **Undo/redo**: No changes needed. Existing snapshot system captures full `EditParams` including `crop.quarterTurns`.

## Files to Create/Modify

### Modify
- `src/types/index.ts` — Add `quarterTurns` to `CropRect`
- `src/stores/editStore.ts` — Update default crop to include `quarterTurns: 0`
- `src/stores/uiStore.ts` — Add `straightenActive` state
- `src/renderer/shaders/geometry.ts` — Add `u_quarterTurns` uniform, total rotation calc, aspect swap
- `src/renderer/WebGLRenderer.ts` — Pass `u_quarterTurns` uniform, handle aspect ratio for odd turns
- `src/components/edit/AdjustmentPanel.tsx` — Add rotation controls (buttons, slider+input, straighten button)
- `src/components/edit/CanvasViewport.tsx` — Handle swapped dimensions for odd quarterTurns
- `src/components/edit/CropOverlay.tsx` — Account for rotation when rendering overlay
- `src/lib/constants.ts` — Add rotation slider config

### Create
- `src/components/edit/StraightenOverlay.tsx` — Line-drawing overlay with apply/cancel
