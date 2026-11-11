---
name: visual-analysis
description: Analyze a video or selected range scene by scene, inspect source and timeline frames, verify visual edits, locate visual changes, and build labeled comparisons. Use for video/reference breakdowns with each scene's words from the existing ChatCut transcript, granular shot and screen-state analysis, or focused frame verification.
user-invocable: true
---

# Visual Analysis

Use this skill when visual evidence decides the answer: understanding a whole
video, breaking down a reference, verifying an edit, comparing before/after
states, finding a visual change, or checking layout and animation.

Choose the amount of analysis from the user's question. For a whole-video or
granular scene breakdown, read
[Scene-by-scene analysis](references/scene-breakdown.md). It pairs inspected
frames with each scene's words from the existing ChatCut transcript and offers
optional JSON. For a focused check,
use the inspection and narrowing guidance below; no full-video report or user
mode selection is required. Both paths use the current host's inspection tools.

## Time Coordinates

Keep the two time domains separate:

- `preview_timeline` with `views:["viewer"]` uses **timeline frame numbers**. Its result reports the actual rendered frame, timeline FPS, and timeline time; the image is returned inline. Exact frames must be before `durationInFrames` and, when a range is supplied, inside `[fromFrame,toFrame)`. `fromFrame` is valid; `toFrame` and `durationInFrames` are exclusive boundaries and are rejected instead of silently moving to another frame.
- `inspect_asset` uses `sourceTimes`, which are integer microseconds in the **original source asset**. They do not include timeline placement, source trim, or playback rate. Trust the returned `sourceTime` for each image.
- Never describe an asset source timestamp as a timeline timestamp. To relate a placed clip to its source, read that item's timeline start, source-start offset, playback rate, and timeline FPS first.
- For baked-in hard cuts, use `detect_scene_cuts` on a placed video item. It returns exact timeline cut frames and source timestamps; review uncertain boundaries using adjacent frames before splitting. Sparse visual sampling alone cannot establish the exact edit frame.

## Tools

### Timeline Composition

Call `preview_timeline` with `views:["viewer"]` to inspect the composed viewer output, including crops, overlays, captions, effects, and motion graphics. Effects or transitions applied directly to a Motion Graphic item are the current exception: the viewer renders the underlying MG without that shader, so confirm those cases in the user's editor. Request only the frames needed for the current comparison.

### Original Asset

Call `inspect_asset` with one video asset and either:

- `sourceFrameCount` for a coarse overview across the original asset.
- `sourceTimes` for exact source-media moments after narrowing.

Use `transcriptRanges` separately to read the existing transcript's words for a visual moment or scene. Its `start` and exclusive `end` are also source microseconds. Do not use `inspect_asset` to claim what a placed timeline composition looks like.

## Footage Quality

- For clearer, sharper, or higher-quality footage, separate visible color, lighting, noise, and softness from source dimensions, timeline scaling/crop, and preview/contact-sheet resizing. Canvas or sheet dimensions do not establish original camera resolution.
- When this distinction changes the edit or a resolution-limit claim, read source dimensions with `inspect_asset` and compare matching source/timeline moments at a useful scale. Requesting one frame can reduce sheet downscaling; source previews and single-frame previews may still be resized.
- Base claims about available enhancement tools or unrecoverable detail on verified capabilities and source evidence. Do not conclude that nothing can help from a montage alone; a narrow clarification can establish which quality improvement the user wants.

## Narrowing A Change

Use coarse-to-fine sampling instead of requesting every frame:

1. Establish one frame before and one frame after the suspected change.
2. Sample 3-7 evenly spaced moments inside that interval.
3. Find the adjacent pair that brackets the first visible difference.
4. Repeat within that smaller interval until the boundary is exact enough; for timeline animation, stop at adjacent timeline frames when exact onset matters.
5. Inspect the full frames once before cropping. Then use the same crop rectangle on every comparison image to isolate the changing region without losing temporal alignment.

For a source asset, repeat the same process with `sourceTimes`. For a timeline, repeat it with frame numbers. Do not mix the coordinates during narrowing.

## Straightening across shots

A clip can contain different camera angles. Choose a reliable level reference
for each affected shot; a doorway viewed in perspective is not enough to infer
camera roll. Apply one rotation to the whole clip only when it suits all shots;
otherwise limit the correction to the intended shot or range and preserve the
others. If the intended reference is unclear, clarify that choice before editing.

Compare matching timeline frames before and after the correction, including
shots that should stay unchanged. Check level, framing and cropped edges together.
Await the edit before requesting its preview, and inspect fresh pixels after an
undo too. Report straightening or restoration only to the extent those frames
verify it.

## Labeled Contact Sheets

`inspect_asset` already returns requested source frames as one labeled inline image and does not write them into the workspace. Use the bundled helper only when the images already exist as workspace files. It preserves argument order and burns labels into the result:

```bash
node .claude/skills/visual-analysis/scripts/concat-images.mjs \
  --output visual-analysis/timeline-change.jpg \
  --columns 3 \
  --caption "frame 120 | timeline 4.000s" \
  --caption "frame 123 | timeline 4.100s" \
  --caption "frame 126 | timeline 4.200s" \
  timeline-frames/frame-120.jpg \
  timeline-frames/frame-123.jpg \
  timeline-frames/frame-126.jpg
```

For a shared spatial region, pass ImageMagick crop geometry in pixels:

```bash
node .claude/skills/visual-analysis/scripts/concat-images.mjs \
  --output visual-analysis/title-region.jpg \
  --crop 900x420+510+120 \
  --caption "source 1250ms" \
  --caption "source 1500ms" \
  asset-frames/source-1250ms.jpg \
  asset-frames/source-1500ms.jpg
```

Options:

- `--output <path>` is required and must end in `.jpg`, `.jpeg`, `.png`, or `.webp`.
- `--columns <1-9>` controls the grid; the default is approximately square.
- `--caption <text>` repeats once per input. If omitted, each tile uses its filename.
- `--crop <WIDTHxHEIGHT+X+Y>` applies the same pixel crop to every input.
- `--tile-width <pixels>` limits each tile width; default `720`.

Read the helper's JSON result, then use `Read` on its `outputPath`. Successful execution alone is not visual verification; inspect the resulting pixels before making a visual claim.

## Rules

- Label every comparison with the returned timeline frame/time or source-asset time. Do not rely on file order alone.
- Keep chronological order left-to-right, then top-to-bottom.
- Build a contact sheet for comparison; inspect a matching individual frame at a useful scale when small details matter.
- Render fresh evidence after an edit. Old workspace images prove the old state only.
- Temporary analysis files are not project assets. Use `push_asset` only when the user asks to keep or use one in the project.
