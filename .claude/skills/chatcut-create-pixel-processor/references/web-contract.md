# Web pixel processor contract

Use a Web Pixel Effect for GPU image processing. Its `.ts` or `.js` entry is import-free and defines an `EffectProcessor` subclass. Compile shaders once in `initialize`; render exclusively from the supplied current-frame context so seeks and export are deterministic.

```ts
const shader: ShaderDefinition = {
  id: "passthrough-fragment",
  source: `#version 300 es
precision highp float;
uniform sampler2D u_input;
in vec2 v_texCoord;
out vec4 fragColor;
void main() { fragColor = texture(u_input, v_texCoord); }`,
};

export class Passthrough extends EffectProcessor {
  async initialize(ctx: ShaderInitContext): Promise<void> {
    ctx.compileShader({ id: "passthrough", fragmentShader: shader });
  }

  protected render(ctx: EffectRenderContext): WebGLTexture {
    return ctx.renderPass({
      id: "passthrough",
      textures: { u_input: { texture: ctx.inputTexture, filter: "linear" } },
    });
  }
}
```

The runtime supplies `ctx.inputTexture`, dimensions, timing, resolved `properties`, and declared processing namespaces. Return `ctx.inputTexture` when an optional analysis result is unavailable. Do not retain host-owned textures across calls.

For face tracking, declare `capabilities:[{id:"faceTracking",type:"face-tracking"}]` during `push_asset`, then read `ctx.faceTracking.faces`. A different declaration ID changes that field name. Select the main face deterministically and use normalized landmarks directly as texture coordinates:

```ts
protected render(ctx: EffectRenderContext): WebGLTexture {
  const faces = ctx.faceTracking.faces;
  if (!Array.isArray(faces) || faces.length === 0) return ctx.inputTexture;
  const face = faces.reduce((best, candidate) => {
    const area = (value) =>
      Math.max(0, value.bounds.right - value.bounds.left) *
      Math.max(0, value.bounds.bottom - value.bounds.top);
    return area(candidate) > area(best) ||
      (area(candidate) === area(best) && candidate.confidence > best.confidence)
      ? candidate
      : best;
  });
  const center = [
    (face.keypoints.leftEye.x + face.keypoints.rightEye.x) / 2,
    (face.keypoints.leftEye.y + face.keypoints.rightEye.y) / 2,
  ];
  // Pass center into the shader with ctx.renderPass(...).
}
```

Properties are read from `ctx.properties`. Web effects also receive `frame`, `time`, `progress`, `fps`, `durationFrames`, and `durationSeconds`. Output is encoded SDR sRGB. Prefer premultiplied-alpha-safe math when changing alpha.

Web Pixel Transitions subclass `TransitionProcessor` and consume the runtime's outgoing and incoming textures. Processing capabilities belong only to Pixel Effects, not transitions.

Maintained examples live in Blink's processing Pixel Effects examples; `effect_face_tracking_scope.ts` is the reference for a tracking-driven magnifier. Blink's Pixel Effects documentation owns the engine contract.
