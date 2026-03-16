# Rawesome

A browser-based RAW photo editor built with WebGL2, React, and WebAssembly.

## Features

- **RAW file support** — Decode CR2, NEF, ARW, DNG, and 20+ RAW formats via libraw-wasm
- **Real-time adjustments** — Exposure, contrast, highlights, shadows, whites, blacks, clarity, vibrance, saturation
- **White balance** — Bradford chromatic adaptation with temperature/tint sliders and presets (Daylight, Cloudy, Tungsten, Flash, Fluorescent)
- **Crop & rotate** — Interactive crop overlay with rule-of-thirds grid and rotation slider
- **WebGL2 rendering** — Two-pass shader pipeline (geometry + adjustments) operating in linear light with sRGB encode
- **Histogram** — Real-time RGB histogram from the adjustment pass output
- **Non-destructive editing** — Undo/redo stack (Ctrl+Z / Ctrl+Y), edits auto-saved to OPFS
- **File persistence** — RAW files, edit parameters, and thumbnails stored in Origin Private File System
- **Export** — JPEG (with quality control) and PNG export via Web Worker
- **Dark / light theme** — Toggle between themes
- **Keyboard shortcuts** — C (crop), V (adjust), \ (before/after), Escape (back to library)
- **Batch import** — Drag multiple files, decoded concurrently via a Web Worker pool

## Tech Stack

- **Vite** + **TypeScript** + **React**
- **libraw-wasm** — LibRaw compiled to WebAssembly for RAW decoding
- **WebGL2** — Custom GLSL shaders for real-time image adjustments
- **Zustand** — State management with undo/redo
- **OPFS** — Origin Private File System for client-side file storage
- **Web Workers** — Decode and encode operations run off the main thread

## Getting Started

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` and drag RAW files onto the library view.

> **Note:** The dev server serves `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers required for SharedArrayBuffer / WASM threading.

## Architecture

```
src/
  components/       # React UI (library view, edit view, sliders, panels)
  renderer/         # WebGL2 renderer, GLSL shaders, white balance math
  workers/          # Web Workers for RAW decode and image export
  stores/           # Zustand stores (edit params, file catalog, UI state)
  hooks/            # Keyboard shortcuts, auto-save
  lib/              # OPFS manager, constants
  styles/           # CSS custom properties, global styles
  types/            # TypeScript types and worker protocol
```

## License

MIT
