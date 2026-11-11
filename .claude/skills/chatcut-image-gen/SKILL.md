---
name: image-gen
description: |
  AI image generation and reference-image editing via GPT Image 2.5 Flare/Sunburst, GPT Image 2, and Nano Banana. Use when the user wants to generate or create an image / picture / still through the backend image-generation jobs.
user-invocable: true
---

# Image Gen

ChatCut image generation and editing require an active paid Pro subscription and use credits for every model. If `submit_image` returns `FEATURE_NOT_INCLUDED`, surface the upgrade requirement; do not retry another ChatCut model to bypass it. Codex native image generation keeps its own host entitlement and is not governed by this ChatCut requirement.

Generate AI images through Desktop's project-pinned `submit_image` tool. Submit-only: creates a generation job and returns a `jobId`.

After submission, use `track_progress` tool to check status or wait for completion.

## Model Selection

| Model                    | Strengths                                     | Max refs |
| ------------------------ | --------------------------------------------- | -------- |
| `gpt-image-2.5-flare`    | Default: fast everyday generation and editing | 10       |
| `gpt-image-2.5-sunburst` | Precision edits and detailed creative work    | 10       |
| `gpt-image-2`            | Previous GPT image model                      | 10       |
| `nano-banana`            | Strongest reference-image fidelity            | 14       |

- `gpt-image-2.5-flare` is the default. Honor the image model attached to the user prompt or explicitly requested.
- Use `gpt-image-2.5-sunburst` when the user selects it for precise editing.
- `nano-banana` is Google's Nano Banana Pro (Gemini 3 Pro Image), not the older Nano Banana. It takes up to 14 references (up to 6 objects, 5 characters and 3 style images) and renders text well. Use it when the user needs more than 10 references or asks for it.

**IMPORTANT:** Before generating, READ the model's reference document for params, limits, and prompt tips:

- Image 2.5 Flare / Sunburst → [references/gpt-image-2.5.md](references/gpt-image-2.5.md)
- `gpt-image-2` → [references/gpt-image-2.md](references/gpt-image-2.md)
- `nano-banana` → [references/nano-banana.md](references/nano-banana.md)

## Tool Params

| Param               | Values                                                                    | Default |
| ------------------- | ------------------------------------------------------------------------- | ------- |
| `aspectRatio`       | `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `4:5`, `5:4`, `21:9`   | `16:9`  |
| `imageSize`         | `1K`, `2K`, `4K`                                                          | `1K`    |
| `quality`           | `low`, `medium`, `high`, `auto`; Image 2.5 also `xhigh`, `max`            | `high`  |
| `background`        | `auto`, `opaque`, `transparent` (Image 2.5 only; PNG output)              | `auto`  |
| `referenceAssetIds` | Array of project asset ids — backend resolves bytes server-side           | —       |
| `referenceUrls`     | Public HTTPS or `s3://` image resources, ordered after project references | —       |
| `name`              | Short descriptive asset name shown in the library                         | —       |
| `count`             | Number of images to generate (1–10, each becomes a separate job)          | `1`     |

## Defaults

- Aspect ratio: **16:9** by default. Match how the image will be used: the project composition for a full-frame image, or the ratio the user asked for. Ask only when the intended use is unclear.
- Size: **1K**.

## Ask Before Submit

- Never auto-upgrade size.
- Only pass `imageSize: "2K"` or `"4K"` when the user asks for it, directly or by approving a plan that names it. Warn that 2K/4K are EXPERIMENTAL and may take longer and cost more.

## Reference Images

Use when the user provides source material to edit, blend, or use as visual guidance (e.g. "change the background", "combine these into a poster").

- Pass project asset ids via `referenceAssetIds`. The backend fetches and encodes them server-side — never pull the asset bytes yourself.
- When the user @-references an image asset, pass its id directly in `referenceAssetIds`.
- Project image references are sent as stored. GPT models accept PNG, JPEG and WebP; `nano-banana` also accepts HEIC/HEIF but only up to 7 MB per image. Convert SVG or HEIC references to PNG or JPEG first.
- Pass public HTTPS or `s3://` image URLs through `referenceUrls`, including resolved skill/catalog resources. PNG, JPEG, WebP and HEIF resources are limited to 5 MiB; HEIF is normalized to PNG. URLs follow `referenceAssetIds` in input order. The combined model limit remains 10 for GPT and 14 for Nano Banana.
- Resource references do not create library assets. Do not download or `push_asset` them merely for generation. Private buckets, base64 and bare local paths are not URL references; import a local file when a project asset is needed.

## Run

```ts
// Basic generation
submit_image({
  model: "gpt-image-2.5-flare",
  prompt: "a cute orange cat",
  name: "Cat",
});

// With quality (OpenAI models)
submit_image({
  model: "gpt-image-2.5-flare",
  prompt: "hero poster with bold title",
  quality: "high",
  name: "Hero Poster",
});

// With reference images — pass project asset ids; backend resolves bytes
submit_image({
  model: "gpt-image-2.5-flare",
  prompt: "change background to beach",
  referenceAssetIds: ["<assetId>"],
  name: "Beach Edit",
});

// Reference-heavy with nano-banana
submit_image({
  model: "nano-banana",
  prompt: "composite poster",
  referenceAssetIds: ["<id1>", "<id2>"],
  name: "Composite",
});

// Multiple images
submit_image({
  model: "gpt-image-2.5-flare",
  prompt: "product shots",
  count: 3,
  name: "Product",
});
```

After submission, unless the user explicitly asked only to queue the job, call `track_progress` with `target=generation action=wait jobIds=<jobId>`. Desktop subscribes to the live job and returns the completed asset or failure to this same conversation; do not busy-poll.

## Rules

- Always provide `name` with a short descriptive asset name.
- Wait for completion unless the user only asked to queue. Use returned asset ids for further edits; use `edit_item` to place an image on the timeline when requested.
- Generation costs credits. Before submitting, briefly tell the user what you're about to generate — especially when generating multiple images.
- Do not use this skill for job management. Use `track_progress` tool for that.
