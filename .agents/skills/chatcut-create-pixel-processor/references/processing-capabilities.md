# Pixel Effect processing capabilities

Pixel Effects consume native analysis of original media independently of their live pixel input. Declare dependencies at import with `push_asset.capabilities`; `processingCapabilities:string[]` is obsolete and rejected.

```json
{
  "filePath": "/absolute/project.chatcutproject/assets/pixel-effect/face-follow/effect.html",
  "type": "pixel-effect",
  "name": "Face Follow",
  "capabilities": [{ "id": "subject", "type": "face-tracking" }],
  "properties": []
}
```

The declaration `id` chooses the render namespace: this example reads `ctx.subject.faces`, not `ctx.faceTracking.faces`. IDs are unique JavaScript identifiers, at most 128 characters, and cannot collide with runtime fields such as `input`, `frame`, `props` or `processing`. Declare at most 64 dependencies. Optional `condition` is a static boolean expression over declared editable property keys, such as `followSubject === true`. Condition properties cannot be keyframed. Undeclared namespaces are absent; disabled declarations expose fresh unavailable results. Never reuse the previous frame's observations.

Use the live `push_asset` description for types admitted by the installed Flux runtime. Pixel Transitions do not accept capabilities.

| Type                                   | Current result at `ctx[id]`                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `face-tracking`                        | `{faces}` with bounds, confidence and five named facial keypoints                                |
| `beauty-analysis`                      | Appearance frame with `faces`, including 106 source-normalized `[x,y]` points per face           |
| `body-analysis`                        | Appearance frame with `bodies`, including 18 `[x,y,confidence]` points per body                  |
| `object-tracking`                      | `{rect}` for a confirmed selected object                                                         |
| `camera-motion`                        | `{pose,observation}` in source-normalized coordinates                                            |
| `beat-tracking`                        | `null` or `{beats:[{beat,timestamp}]}`; timestamps are microseconds relative to the Effect start |
| `portrait-matte`, `smart-object-matte` | HTML `matteImage` / Web `matteTexture`, plus `matteWidth`, `matteHeight`                         |
| `depth-matte`                          | HTML `depthImage` / Web `depthTexture`, plus `depthWidth`, `depthHeight`                         |
| `color-descriptor`                     | HTML `sourceImage` / Web `sourceTexture`, dimensions and nullable color descriptor               |

## Face and body observations

`faces:null` / `bodies:null` means unavailable. `[]` means analysis completed and found no subject. Face Tracking supplies five named keypoints; Beauty's face `points` supplies 106 landmarks and is a different contract. Body points carry individual confidence, which the authored treatment must check. Coordinates use the display-oriented original source, not the canvas or a preceding Effect's warped output. Convert through the clip crop/placement yourself and account for Effect ordering.

```js
render(ctx) {
  const faces = ctx.subject?.faces;
  const face = Array.isArray(faces) && faces.length
    ? faces.reduce((best, candidate) => {
        const area = (v) => Math.max(0, v.bounds.right - v.bounds.left) *
          Math.max(0, v.bounds.bottom - v.bounds.top);
        return area(candidate) > area(best) ? candidate : best;
      })
    : null;
  // Draw the current input first; absent analysis leaves that input unchanged.
  canvasContext.drawImage(input, 0, 0, width, height);
  if (!face) return;
  const x = (face.keypoints.leftEye.x + face.keypoints.rightEye.x) / 2;
  const y = (face.keypoints.leftEye.y + face.keypoints.rightEye.y) / 2;
  drawDecoration(x * width, y * height);
}
```

Declare Beauty as `{id:"people",type:"beauty-analysis"}` and read `ctx.people?.faces?.[0]?.points`; Body similarly uses `ctx.pose?.bodies?.[0]?.points` for a declaration named `pose`. Select subjects deterministically by returned identity/geometry. The 88 auxiliary facial points are derived by Flux's geometry helper; do not expect them in raw `extra`. Treat optional `skin`, `retouch`, `blemish`, `flow`, `fitting` and fitting-camera fields as nullable/empty. A plain custom declaration requests base detection; it does not activate built-in Beauty settings, makeup, skin segmentation or fitting. Those extra demands depend on the engine's appearance settings contract and are not general declaration options. Do not invent `skin:true` or `fitting:true` fields on `push_asset.capabilities`.

Seek behavior must be deterministic. Do not accumulate smoothing or author fake coordinates when observations are unavailable.

## Source selection and binding

Each capability selects its own original compatible source. An Item target prefers that Item when compatible; otherwise the normal compatible-source scan starts at its track and proceeds downward. A track target scans that track and lower tracks. Bind a specific source track on the placed Effect with:

```text
edit_item({updates:[{id:"<effect-id>",type:"pixel-effect",capabilities:[{id:"subject",trackId:"<source-track-id>"}]}]})
```

The binding `id` must match an asset declaration. The array replaces all bindings; preserve sibling entries. `[]` restores automatic selection. An omitted array preserves existing bindings. An explicitly chosen track without compatible active media gives unavailable analysis, with no fallback to another track. Beauty, Body, Portrait, Depth and Smart Object impose the installed engine's target restrictions; in the released SDK these Pixel capabilities require an Item target. Use Video/Image/GIF for Beauty/Body, Video/Image for Portrait/Depth, and Video/Image/GIF for Smart Object. Camera Motion needs Video; Beat Tracking needs decoded Audio or Video sound.

Object Tracking and Smart Object Matte additionally need a confirmed source-bound selection on the instance; follow their selection tools rather than guessing a rectangle or trajectory. Source analysis is independent of preceding spatial Effects and is not automatically warped into their output.

## Images, unavailable results and verification

HTML matte carriers contain premultiplied white with matte alpha. For Canvas 2D, draw the current input into an owned canvas, use `destination-in` with the current matte, then composite. Native-bound images are owned by the current render invocation; do not change their attributes or retain them across frames. Web uses the corresponding auxiliary textures. A color sidecar is the original acquisition-color input and does not apply Log restoration or OCIO by itself.

Native import validation receives deterministic unavailable observations. Passing it verifies source and fallback execution; it does not prove that analysis started. Place the Effect on compatible media, verify processor/job progress for its consumer and capability ID, then inspect representative frames and backward seeks when visual quality is in scope. Missing inputs must keep a deterministic fallback rather than stale observations or a thrown exception.
