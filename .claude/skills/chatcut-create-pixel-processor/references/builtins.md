# Desktop built-in pixel processing

These examples use ChatCut Desktop contracts. Other hosts should follow their live Library results and tool schemas rather than reuse these IDs or placement fields.

### Zoom on a clip

For a whole-clip effect, pass `targetItemId`; it follows that clip. For part of the clip, also pass its absolute timeline `startFrame` and `durationFrames`.

```text
# Zoom on the entire video clip
edit_item({adds:[{type:"pixel-effect",assetId:"builtin:effect-zoom",targetItemId:"<clip-id>",propertyOverrides:{magnification:1.5,shape:"hold"}}]})

# Zoom on a sub-range of the clip (e.g. frames 90–150 only, a punch zoom on a beat)
edit_item({adds:[{type:"pixel-effect",assetId:"builtin:effect-zoom",targetItemId:"<clip-id>",startFrame:90,durationFrames:60,propertyOverrides:{magnification:2,shape:"punch"}}]})
```

Use `preview_timeline({views:["timeline"],tracks:["V1"]})` to obtain track item ids and timeline-frame ranges. Use `inspect_item({itemId:"..."})` when exact item detail is needed.

| Key             | Type   | Range / values                             | Default | Notes                                        |
| --------------- | ------ | ------------------------------------------ | ------- | -------------------------------------------- |
| `magnification` | number | 1–4                                        | `1.5`   | Zoom factor; 1 = no zoom, 2 = 2× in          |
| `focalPointX`   | number | 0–1                                        | `0.5`   | Horizontal focal point (0 = left, 1 = right) |
| `focalPointY`   | number | 0–1                                        | `0.5`   | Vertical focal point (0 = top, 1 = bottom)   |
| `shape`         | select | `punch` / `hold` / `slow-push` / `instant` | `hold`  | Animation curve                              |
| `easeInFrames`  | number | 0–60                                       | `8`     | Frames to ramp in                            |
| `easeOutFrames` | number | 0–60                                       | `8`     | Frames to ramp out                           |

Omit `propertyOverrides` entirely for default zoom. Send only the keys you want to change — patch semantics.

Zoom uses the supplied focal point. Face-tracking zoom, AI super resolution,
and video stabilization are not available in this Desktop release.

### Mask: Portrait and Smart Object

For people cutout, background removal, transparent portrait background, 人物抠像（AI）, 抠图, or 去背景, use the Portrait tool inside the unified Mask effect. Inspect the Mask asset for current tool templates and properties. Copy the Portrait template's stable ID and set its duration to the clip duration. This example covers a 180-frame clip:

```text
browse_library({category: "effects", query: "mask"})
inspect_asset({assetId: "builtin:effect-mask"})
edit_item({adds: [{
  type: "pixel-effect",
  assetId: "builtin:effect-mask",
  targetItemId: "<video-item-id>",
  mask: {
    mode: "set",
    nodes: [{
      id: "<portrait-template-id>",
      kind: "portrait",
      enabled: true,
      invert: false,
      startFrame: 0,
      durationFrames: 180,
      operation: "intersect",
      parameters: {feather: 0, matteOffset: 0}
    }],
    corrections: []
  }
}]})
```

Portrait supports one `video` or `image` clip. For the whole clip, pass `targetItemId` and omit effect-level `target`, `trackId`, `startFrame` and `durationFrames`; tool timing remains relative to the effect. Desktop downloads the model and prepares the matte cache automatically; processing may continue after the timeline edit succeeds. Verify the rendered result with `preview_timeline({views:["viewer"],viewerFrames:[30,90]})`. Default transparency starts with alpha 1, so the first cutout tool uses `intersect`; `union` would keep the whole frame opaque. A returned image or accepted selection does not prove cutout readiness: inspect actual background transparency or the intended behind-person composite, and report preparation errors instead of repeating fixed sleeps.

Portrait's `feather` and `matteOffset` belong to the tool parameters. To update them, use `propertyOverrides` keys `mask.<toolId>.feather` and `mask.<toolId>.matteOffset`. Global transparency, alpha processing and stroke controls belong to the Mask effect; read their current definitions with `inspect_asset`. `outlineStyle` and `alphaProcessing` are static controls.

For selection of a specific object, copy the complete `smart` tool from the same Mask templates with `operation:"intersect"`, then call `select_matte_object` with the returned full effect UUID or 10-hex prefix and source-normalized selection points. That tool confirms Smart Object selections; Portrait starts automatically without a point selection. Preserve unmentioned tools when replacing an existing Mask structure.

### Desktop Color

Inspect a clip with `inspect_item` to read Color's authored values, stable effect IDs and processing order. Read the current schema and native defaults with `inspect_asset({assetId:"builtin:pixel-effect-color"})`. Inspecting a neutral clip does not create an effect. A sparse semantic patch creates Color only when it changes a value:

```json
{ "updates": [{ "id": "<clip-id>", "color": { "exposure": 0.3 } }] }
```

New semantic Color starts neutral (`inputProfile:"none"`, `coreLook:"neutral"`). To address a specific existing Color instance, include its returned `effectId` inside `color`. A composition-wide grade uses `updates:[{id:"<timeline-id>",type:"timeline",color:{exposure:0.3}}]` and processes the composed timeline. Adjustment clips and masks attached to effects are not supported.

### Desktop LUT library

Import a `.cube` or `.3dl` file with `push_asset`:

```json
{ "filePath": "/absolute/look.cube" }
```

The import registers a standalone file-backed pixel effect and adds the file to the shared local LUT collection. Use the returned `library.id` content hash for Color; the project `assetId` identifies the standalone effect. Existing shared LUTs and built-in looks can be found through `browse_library({category:"luts"})`; a listed built-in look is installed on first use. An ID that is not listed is rejected.

```json
{
  "updates": [
    {
      "id": "<clip-id>",
      "color": { "lookLut": "<library-id>", "lookLutIntensity": 0.8 }
    }
  ]
}
```

Use `sourceLut` for the input LUT and `lookLut` for the creative LUT. Read the Color schema for supported values. Replace or clear the relevant reference to change a LUT while preserving the rest of the grade.

### Desktop effect placement

- Clip effects use `targetItemId` and follow that item. Optional range fields limit coverage within the clip.
- Track effects use `trackId`, `startFrame` and `durationFrames`; they process the composition below that track during their range.
- Whole-composition effects use `target:{kind:"timeline"}` without a track or authored range. Their duration follows the timeline and they cannot be dragged.
