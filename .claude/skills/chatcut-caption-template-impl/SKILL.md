---
name: caption-template-impl
description: Design, recreate from references, and revise custom animated captions and kinetic typography. Author reusable caption template source directly in the main agent, bind it to real caption Cards, and verify the rendered captions.
---

# Caption template source

For ordinary caption tweaks, use `read_captions` / `edit_captions`; for a new look, discover published presets with `edit_captions action:"template"` first. Use this source-authoring workflow when the requested custom treatment is not supplied by that catalog or when revising an existing custom renderer. Keyword selection, wording, grouping and exposed template properties do not require a new renderer.

Before designing, recreating, or changing a custom treatment's visual behavior, read [Creating and recreating MG captions](references/mg-captions.en.md) completely. It covers Design Style/footage-led direction, semantic emphasis, typography, motion continuity, reusable layouts and real-caption review. The Desktop authoring and binding contract below remains authoritative; routine exposed-property edits do not require redesign.

Create and revise the requested caption treatment directly in the main agent. Do not use `delegate_task` for captions. Keep a reusable local Remotion JSX/TSX or HTML entry in a persistent project-owned directory, including the project workspace. Render the actual Card text and word timing supplied at runtime. Do not import the template as a library asset with `push_asset` or place a separate timeline item.

This workflow targets Desktop projects with local file tools and `edit_captions` template bindings, including external agents connected to Desktop. The `caption_v1` data contract is also used by Web caption renderers; it does not make Desktop file paths or local HTML entries available to Web projects.

For Remotion the root receives `{ item }`. Use `useSpecialEffects().caption_v1` and configured values from `item.props`:

```jsx
export default function CaptionTemplate({ item }) {
  const caption = useSpecialEffects().caption_v1;
  return (
    <div style={{ color: "white", fontSize: 38 }}>{caption.content.text}</div>
  );
}
```

The entry's final extension selects the runtime: `.html` uses HTML; `.js`, `.jsx`, `.ts`, or `.tsx` uses a Remotion component receiving `{ item }`. `index.html.js` therefore selects Remotion.

For HTML, validate a complete `caption.html` document containing exactly one module script. To keep the mount implementation in a local `caption.js` beside it, use this entry:

```html
<!doctype html>
<html>
  <body>
    <script type="module" src="./caption.js"></script>
  </body>
</html>
```

The module default-exports `mount({ root, props })`, returning `update`, `render`, and `dispose`. Initial props are empty; keep the latest `props` from `update({ props })`, and render `props.caption` through elements under `root`. Do not capture the initial empty props permanently.

`caption_v1` contains `status:"ready"`, `cue:{id,programId}`, `content:{text,lines,words}`, `timing:{startFrame,endFrame,durationInFrames}`, `source`, and `active:{frame,words}`. Protocol frames and word `timelineStartFrame`/`timelineEndFrame` are absolute timeline frames. `useCurrentFrame()` remains Card-local; nested Sequences adjust that local frame without changing the protocol clock. Source fields and word source timestamps are null when native provenance is unavailable; do not infer a source clock. Only caption-owned templates receive this protocol; ordinary MGs receive no caption data.

`display:{punctuationMode:"all"|"default"|"none",textTransform:"none"|"uppercase"}` exposes the effective display settings. Render `content.text`, line `text`, and word `text` directly: punctuation and case are already applied. Line and word `rawText` retain the authored spelling and punctuation; style-span UTF-16 offsets address that raw text. Do not apply the display transforms again or slice transformed text with raw offsets. Older payloads may omit `display` and metadata; use their supplied display text. Explicit punctuation mode wins over the legacy setting. On Web, legacy `hidePunctuation:true` resolves to `default`, false or absent to `all`; Desktop supplies its effective native mode.

Words include `id`, `wordGroupId`, `emphasis`, `emphasisSource`, and style spans. A shared `wordGroupId` marks tokens that belong to one word for wrapping; each token keeps its own timing. `emphasisSource` is `auto`, `manual`, or `suppressed`; honor explicit suppression. Optional `sequence:{index,count,neighbors}` describes the Card's position in its complete caption source. Each neighbor includes its index, duration and adjacent pauses in seconds, character count, and sentence-ending flag. Use this context for deterministic variation instead of mounted-frame history; starting an audition halfway through must not make that Card a new opening.

Existing native templates can keep using `item.props.caption` (or HTML `props.caption`). This legacy context includes `text`, `visibleText`, `words`, `frame`, `fps`, `time`, `start`, `end`, `geometry`, `style`, `cardId`, `trackId`, and `languageCode`. `start` is zero; `end` is Card duration in seconds. `time` and each word's `start`/`end` are seconds relative to the Card. Word entries also carry `text`, `id`, `sourceTokenIds`, `active`, `visible`, `startFrame` and `endFrame`. Frame-based animation can use `caption.frame` or Remotion `useCurrentFrame()`; time resets for each Card.

For expressive animation, translate the spoken meaning into word position, entrance rhythm and motion hierarchy. Different phrases may use exposed properties to vary the treatment while sharing one source. Make emphasized captions visibly distinct from ordinary captions; size or active-word color alone is insufficient when expressive movement is requested. Animate actual runtime words at their supplied times, not a fixed demonstration sentence.

Compose captions as part of the whole image. Group words by meaning, vary typographic hierarchy and placement, and use the subject's surrounding negative space instead of defaulting every phrase to a bottom strip. Choose motion and color in relation to the footage and overall design; saturated colors can work when they support that composition. A warm treatment does not require a particular hue.

Fit real short and long phrases to the supplied Card dimensions. Use the requested line grouping, letter spacing, readable scale, emphasis and subject clearance; keep entrance/exit motion within each Card's duration. Do not replace speech with decorative fixed copy. Reconstruct the requested frame deterministically, including backward seeks.

Call `edit_captions` with `action:"set_card_style"` and its `json` string payload. Bind the persistent entry to fresh Card IDs from `read_captions`:

```json
{
  "action": "set_card_style",
  "json": "{\"cardId\":\"<actual Card id>\",\"style\":{\"template\":{\"path\":\"/absolute/project/workspace/caption.jsx\",\"runtime\":\"remotion\"}},\"mode\":\"merge\"}"
}
```

Use `runtime:"html"` for an HTML entry. Reuse the same source across actual short and long phrases; add `template.properties` for supported variations. Batch independent bindings with `edit_captions action:"batch"`. For revisions, inspect and edit that same source, then verify the affected Cards again. Preserve existing checkpoint/source files when continuing an older caption task directly; do not start or resume a caption specialist. `template:null` restores ordinary captions; omitting the field in a merge leaves an existing override unchanged.

The main agent does not have the specialist-only `validate_motion_graphic`, `publish_output`, or `pause_task` tools. Do not wait for a host to deliver or publish the source. Inspect actual bound Cards over the footage, including word changes, Card boundaries, backward seeks, short/long phrases and face clearance. Re-read/reopen the saved project and inspect the requested export before claiming completion. Source checks, successful binding and a standalone preview do not prove correct caption pixels or output quality. Explain any actual blocker and the checks not performed.
