---
name: create-pixel-processor
description: Create and refine Desktop video effects, masks, color treatments, and transitions by writing Flux/Blink Web or HTML pixel processors directly. Use for entrance/exit animation of existing footage, chapter transitions, 入场动画、出场动画、章节转场、特效、滤镜、蒙版、调色、转场 and custom treatments of existing footage; use Motion Graphics for standalone generated graphics.
---

# Create Pixel Processor

Write the effect or transition yourself as a local Web (`.ts`/`.js`) or HTML (`.html`) entry and supporting files. Import it with `push_asset`, then apply it with `edit_item` when the user wants it on footage. This workflow runs authored code in Flux/Blink; it does not submit a generation job.

Create and revise pixel processors directly in the main agent, including when `delegate_task` is available. Own the design, source, import, placement and review in the same context. Do not delegate ordinary pixel effects or transitions. Audio processors and caption templates follow their separate workflows.

## Choose the treatment

Choose the route from the user's intent before browsing:

- Ordinary polish, named presets and parameter adjustments: use built-ins. Search the relevant category/query directly; returned `use` instructions are sufficient to apply a match. Read detail only for missing information, not as a mandatory step for every candidate.
- A request to design a distinctive entrance, exit, or chapter transition is a creation task even if the user never says HTML or "custom". Use the live footage as the material for an original design; do not reduce it to a stock zoom plus fade simply because those are available. Load this skill, inspect representative footage and author the processor directly. Existing-input entrance/exit animation is a pixel effect; connecting two shots is a pixel transition.
- A request merely to add a transition can still use a fitting built-in. Do not treat every mention of animation or "smooth" as a mandate to author code. Honor a named preset or an explicit request to reuse built-ins.

For Desktop Color, zoom, Mask Portrait/Smart Object and LUT file resources, read [Desktop built-in recipes](references/builtins.md) before applying them. For cutout, inspect `builtin:effect-mask` and copy its complete tool template instead of guessing the schema; use `intersect` for the first Portrait or Smart tool with default transparency. Other hosts should follow their live Library results and tool schemas; builtin IDs, resource types and placement fields can differ. Segmentation should reuse the host's native cutout when available. For original design, start from the request and footage; catalog enumeration is not a required creative phase.

When one imported video contains baked-in cuts, use `detect_scene_cuts` on its placed video item before actor tracking, smart cutout, or shot-specific grading. Review doubtful boundaries, pass the returned `splitItemArguments` to `split_item`, then use its `newIds` to treat each shot separately. Do not estimate hard cuts from sparse screenshots or track across unrelated shots. The detector analyzes every decoded frame; motion, flashes, dissolves, and similar-looking cuts can still need review.

- A **pixel effect** transforms one live input. It can target a clip or a track range.
- A **pixel transition** combines two adjacent clips at a cut. It needs both endpoint item IDs and available source handles.
- A standalone scene without input footage belongs in the Motion Graphic workflow.

Choose the runtime before authoring. Use Web for shader-based image processing, especially when a tracking observation drives a crop, mask, warp, or decoration. Use HTML when DOM, Canvas 2D, text layout, or browser libraries materially simplify the treatment. Read the matching [Web processor contract](references/web-contract.md) or [HTML processor contract](references/html-contract.md). When the treatment needs native analysis or mattes, also read [processing capabilities](references/processing-capabilities.md). Extend the examples to the intended visual treatment, rather than substituting a pre-rendered video or unrelated overlay.

## Design intent

Before implementation, briefly state the intended viewer experience and how it serves the user’s request and available footage. Use this intent to guide composition, motion, timing, and the relationship between the inputs. Make these choices form a coherent whole; choose the visual language to suit the request, without assuming a preferred style or a required set of techniques.

Treat the first implementation as a draft. Compare rendered output with the stated intent, identify concrete gaps, and revise the source and validate again. Successful execution alone does not establish that the design works. When reference footage is unavailable, state that limitation rather than inventing observations about it.

For an entrance built from newspapers, cards, posters or frames, make the live input part of the main composition: put the current footage inside its principal picture area and animate that surface into the final shot. Do not replace the subject with a drawn silhouette or placeholder portrait, or count a full-screen input hidden behind unrelated overlays as integration. Draw the current input each frame through the intended crop, mask and transform. Review the intermediate composition, not only whether the original shot returns at the end. Apply this when the treatment calls for picture-bearing surfaces; it is not a requirement that every effect use cards.

### Bad case: decorative flash mistaken for a designed entrance

In a software-update talking-head video, a slatted reveal added lime outlines, blur/zoom and a bright lime sweep merely because the subtitles used lime. The user rejected the flash as cheap-looking. Matching an accent color does not justify a light effect, and “cool / 炫酷” is not a request for glow or a sweep. Build the entrance around the live picture's composition, reveal order and settling. Omit decorative flashes by default unless the requested aesthetic or a clear compositional purpose supports them; this is not a blanket ban on expressive lighting.

## Source organization

Keep the processor **self-contained as a directory**, with a clear entry and local dependencies. Web source is import-free; HTML may use local modules and resources. Prefer focused files when distinct responsibilities emerge, so the entry remains easy to read and individual concerns can be revised independently. Choose boundaries from the implementation rather than a fixed file list or file-count target. A small processor may remain in one file.

Keep related implementation together, make dependencies explicit through local imports, and avoid duplicating state or introducing abstractions only to split files. Validate and review through the entry after changes to any supporting file.

## Author, import, apply

The Agent working directory is `<project>.chatcutproject/workspace`. Write reusable effect source under `<project>.chatcutproject/assets/pixel-effect/` and transition source under `<project>.chatcutproject/assets/pixel-transition/`, using the actual open project path from the runtime context. Choose your own descriptive subdirectory and entry filename (for example `face-focus/effect.ts` or `panel-fold/transition.html`); neither must be a UUID or `index.html`. Keep related resources together and avoid overwriting existing processors. These are authored source files, not the asset metadata JSON files managed by Project tools. `push_asset` generates the asset UUID independently and records the path without moving files. Do not create an asset UUID yourself or rename the directory after import. A Web entry defines an `EffectProcessor` or `TransitionProcessor` subclass; an `.html` entry must contain exactly one module script that default-exports `mount`.

```json
{
  "filePath": "/absolute/MyProject.chatcutproject/assets/pixel-effect/prism/effect.html",
  "type": "pixel-effect",
  "name": "Prism",
  "capabilities": [{ "id": "subject", "type": "face-tracking" }],
  "properties": [
    {
      "key": "strength",
      "label": "Strength",
      "type": "number",
      "defaultValue": 0.25,
      "min": 0,
      "max": 1,
      "step": 0.01
    }
  ]
}
```

Call `push_asset` with that object. Use `type: "pixel-transition"` for a transition. Desktop selects `{kind:"web"}` from a `.ts`/`.js` path and `{kind:"html"}` from an `.html` path, then keeps that source linked. Width, height and duration are supplied by the target composition, not import parameters. Import runs matching native Flux validation before registering the asset. Check each returned result for success before using its asset ID. On validation failure, use the returned diagnostics to fix the source and retry `push_asset`; no asset is created for the failed entry.

`capabilities:[{id,type,condition?}]` declares native dependencies on the asset. The chosen `id` names the render context field (`subject` above means `ctx.subject`); it is not inferred from the capability type. Optional conditions are static boolean expressions over declared editable properties. Declare every dependency the source consumes. Pixel Transitions do not accept capabilities. Read [processing capabilities](references/processing-capabilities.md) for supported types, instance source bindings, base face/body observations and unavailable results. The legacy `processingCapabilities:string[]` field is rejected. Never simulate tracking with hard-coded coordinates, sparse screenshots, or many static clip splits when a native tracking capability matches the request.

Desktop pixel effects can attach directly to visual items, including `motion-graphic` and `svg`, using `targetItemId`. A block effect processes the underlying track composite, so do not substitute it for an item effect merely because the item is a Motion Graphic. Effect-specific restrictions (such as Mask Portrait requiring image/video) still apply. On other hosts, use the placement fields and supported targets in their live tool schemas.

For application, read the affected timeline with `preview_timeline` and inspect the relevant items. Use returned IDs, not guessed ones:

```text
edit_item({adds:[{type:"pixel-effect",assetId:"<asset-id>",targetItemId:"<clip-id>",propertyOverrides:{strength:0.35}}]})
edit_item({adds:[{type:"pixel-effect",assetId:"<asset-id>",trackId:"<track-id>",startFrame:90,durationFrames:60}]})
edit_item({adds:[{type:"pixel-transition",assetId:"<asset-id>",outgoingItemId:"<outgoing-id>",incomingItemId:"<incoming-id>",durationFrames:24}]})
```

A failed transition placement may require a shorter duration or more clip handles. Do not silently move unrelated clips. Importing a reusable asset alone is enough when the user only asks to create an effect.

## Properties and revisions

`asset.properties` is an array defining controls. Pixel processor property types are `number`, `boolean`, `color`, `select`, and `vec2`; do not use Motion Graphic-only property types. Resolved defaults plus the applied item's `propertyOverrides` arrive as `props` in `update({props, revision})`. Read them there, with sensible fallbacks, and render using the latest values.

Use `edit_asset` to update the asset's property schema and `edit_item` for a particular instance's overrides. Edit the linked source and supporting files directly for code changes. Do not send HTML through `edit_asset.code` / `codeFile`, which follows the legacy TypeScript source-materialization path. Inspect the asset path before changing an existing asset, and preserve its runtime.

## Verify what the viewer sees

A successful import proves registration, not visual correctness. Apply the effect to representative footage and use the available timeline/asset frame preview tools to inspect the beginning, middle, and end; seek backward as well. For transitions, check that the endpoints exactly match outgoing and incoming frames without flashes or residual layers. Check both live-input motion and editable-property changes. Judge visual fit as well as correctness: if removing a flash, sweep or glow leaves the intended entrance intact and makes the subject clearer, remove it instead of treating extra activity as polish.

When native Flux validation is available, validate the matching runtime kind and path through `validation.validatePixelEffectCode` or `validation.validatePixelTransitionCode`. This uses the native processor and deterministic probes; it does not replace visual review. Surface actual import/render errors, fix the source, and verify again. If native execution is unavailable, label browser-only previews as such rather than claiming the effect works in Desktop.

Assess motion and timing through continuous playback when available. Sampled frames support visual inspection but do not prove temporal quality; report what was actually observed and leave unverified aspects explicit.
