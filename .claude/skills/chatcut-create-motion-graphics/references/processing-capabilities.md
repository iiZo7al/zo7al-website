# Motion Graphic native processing inputs

Use named native processing declarations when an MG reacts to real source faces, bodies, camera motion or audio beats. These inputs are shared by HTML and Remotion. They do not require a separate tool for fetching landmarks.

Read the live `push_asset` description for the installed MG consumer's supported types. Face Tracking, Camera Motion and Beat Tracking are supported by the released SDK. Beauty/Body are usable only when that runtime explicitly admits them for `motion-graphic`; an Effect supporting a type does not establish MG support. Other Pixel capabilities, including mattes and color descriptors, cannot be assumed available on MG.

```json
{
  "filePath": "/absolute/project.chatcutproject/assets/motion-graphic/follow/entry.html",
  "type": "motion-graphic",
  "name": "Source Follow",
  "width": 1920,
  "height": 1080,
  "duration": 3000000,
  "properties": [],
  "capabilities": [{ "id": "subject", "type": "face-tracking" }]
}
```

The chosen `id`, not the capability type, names the runtime result. HTML reads `render(ctx)` → `ctx.subject`; Remotion reads the root component's `item.subject`. `item.props` remains editable property values. Declare every dependency at import so validation, preparation, playback, capture and export see the same demands. `processingCapabilities:string[]` is obsolete. IDs must be unique JavaScript identifiers and must not collide with runtime fields. An optional `condition` is a boolean expression over declared static property keys; condition properties cannot be animated.

## Bind original sources

Place the MG above compatible original footage, or select a source track explicitly for each dependency:

```text
edit_item({adds:[{type:"motion-graphic",assetId:"<mg-asset-id>",trackId:"<overlay-track-id>",startFrame:0,durationFrames:90,capabilities:[{id:"subject",trackId:"<video-track-id>"}]}]})
```

The asset holds declarations `{id,type,condition?}`; the placed Item holds source bindings `{id,trackId?}`. Source binding never belongs in `processing`, which configures Video/Audio source treatments. An update's `capabilities` array replaces all instance bindings, so preserve sibling entries; `[]` restores automatic selection, and omission preserves bindings. An explicit track with no compatible active clip gives unavailable results. Automatic selection scans the MG track and lower tracks for each capability independently. No inference runs on the rendered MG itself. Importing an asset without a placed consumer does not start source analysis.

The source clock follows placement, source trim, speed and cuts. Geometry is normalized to the display-oriented original source; map it through that source clip's crop and composition placement. The MG's canvas coordinates are not source coordinates. Analysis is independent of preceding Effect warps. Do not cache a previous subject or invent a trajectory during unavailable samples.

## Consume current results

| Type                             | Result at the declared ID                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `face-tracking`                  | `{faces:null}` while unavailable; `faces:[]` when no face; each face has normalized bounds, confidence and five named keypoints |
| `camera-motion`                  | `{pose,observation}`; either field may be null; pose includes accumulated 2D transform, rotation, scale and translation         |
| `beat-tracking`                  | `null` or `{beats:[{beat,timestamp}]}`; timestamps are integer microseconds in MG source time, including trim and playback rate |
| `beauty-analysis`, when admitted | Appearance frame with nullable `faces`, each with `id` and 106 normalized `[x,y]` points                                        |
| `body-analysis`, when admitted   | Appearance frame with nullable `bodies`, each with `id` and 18 `[x,y,confidence]` points                                        |

For HTML, reconstruct each frame from the current result:

```js
export default function mount({ root }) {
  const marker = root.querySelector(".marker");
  return {
    render(ctx) {
      const face = ctx.subject?.faces?.[0];
      marker.hidden = !face;
      if (!face) return;
      const { leftEye, rightEye } = face.keypoints;
      marker.style.left = `${(leftEye.x + rightEye.x) * 50}%`;
      marker.style.top = `${(leftEye.y + rightEye.y) * 50}%`;
    },
    dispose() {},
  };
}
```

This example assumes the source fills the same viewport. For Remotion, read `const faces = item.subject?.faces` inside the root and return a deterministic empty/fallback graphic when unavailable. Select a subject consistently, handle empty arrays, and check body-point confidence. Keep animation tied to supplied frame/time and avoid playback-history state. A disabled declaration supplies the runtime's unavailable result; an undeclared namespace is absent. Successful empty analysis is distinct from unavailable analysis.

Beauty's 106 landmarks differ from Face Tracking's five keypoints. Flux derives another 88 auxiliary facial points through its geometry helper; raw `extra` is not that derived array. Plain custom Beauty/Body declarations request base detection. Optional skin/retouch/blemish/flow/fitting outputs remain nullable or empty and are not guaranteed by base detection. Built-in appearance settings determine extra model demands; there are no general `skin`/`retouch`/`fitting` switches in `push_asset.capabilities`. MG tracking does not enable the clip's Beauty controls.

## Validation and evidence

Import validation receives unavailable synthetic results and checks fallback execution, not source analysis. After a successful import, inspect the asset to verify declarations, place it on compatible media, and inspect its source bindings. Verify native processing progress or a job start with the consumer ID and capability ID before claiming the dependency runs. Preview representative frames and backward seeks when visual quality is requested. A successful `push_asset` or `edit_item` response alone proves neither processing readiness nor output quality.
