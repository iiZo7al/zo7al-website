---
name: create-motion-graphics
description: |
  Create, revise, and place Motion Graphics by writing the code directly.
  Use for the full MG-making workflow: early visual/style alignment, choosing
  or comparing directions, browsing/recommending MG styles and visual references
  without production, deciding overlay vs full-frame, generating MG, modifying
  existing MG code, fixing broken animations, converting a finished MG into a
  transparent video asset, or combining newly generated MG with TTS / voiceover /
  narration (motion graphic / MG / 动画 / MG 动画 / title card / 字卡 / lower third /
  选风格 / 浏览参考 / 推荐参考 / MG + TTS / MG + 旁白 / 转成视频 / MG 转视频 /
  convert MG to video / bake MG).
---

# Create Motion Graphics

Use this skill when the active task requires a Motion Graphic asset authored or
patched as HTML or Remotion source files. The host selects this direct-authoring
workflow for supported agents and models.

Write the MG in the active Desktop agent workspace, then call `push_asset` with
`filePath` pointing to its entry file and `type: "motion-graphic"`. Keep the source
files and relative supporting modules available for playback and export.
Do not use `delegate_task` or `submit_motion_graphic` for ordinary MG assets or
revisions. Caption tweaks use `read_captions` / `edit_captions` and published
ordinary/animated presets, not separate MG assets. For a requested custom caption
treatment absent from that catalog or a custom-template revision, load
`caption-template-impl` and author/bind caption source directly in the main agent.
Follow its caption-specific creative workflow rather than the ordinary MG
style-picker and reference-browsing steps below.

## Native processing inputs

For graphics driven by source faces, bodies, camera motion or music beats, read [processing capabilities](references/processing-capabilities.md) before authoring. Use the live `push_asset` description for supported MG capability types; declare them as `capabilities:[{id,type,condition?}]` when importing, then bind original source tracks on the placed MG with `edit_item` if automatic selection is unsuitable. HTML reads `render(ctx)[id]`; Remotion reads `item[id]`. Build a deterministic unavailable-result fallback. These are render inputs, not a separate tool to fetch face landmarks.

## Frame-rate-independent animation (required)

For Remotion animation, read both `useCurrentFrame()` and `fps` from
`useVideoConfig()`. A graphic that uses `useCurrentFrame()` without reading
config `fps` is invalid and must be rewritten before creation or update.
Reading `durationInFrames` alone is insufficient; do not hardcode a 30/60 fps
fallback. Static graphics that do not use `useCurrentFrame()` need no fps read.

Express delays, durations, easing, loops and exit timing in seconds. Normalize
with `const time = frame / fps`; when an API needs frames, use `seconds * fps`.
For example, replace `interpolate(frame, [0, 30], [0, 1])` with
`interpolate(time, [0, 1], [0, 1])`, or use `[0, fps]` as the frame range.
Pass the config `fps` to `spring`. Keep `frame / durationInFrames` for motion
intentionally tied to total progress. For HTML, use the supplied timeline time
in seconds rather than assuming a frame rate.

```jsx
const frame = useCurrentFrame();
const { fps, durationInFrames } = useVideoConfig();
const time = frame / fps;
const durationSeconds = durationInFrames / fps;
const enter = interpolate(time, [0.2, 0.7], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
const exit = Math.min(1, Math.max(0, (durationSeconds - time) / 0.3));
```

Merely reading `fps` does not make hardcoded frame timing correct. At the same
elapsed second, 30fps and 60fps must produce the same animation state (allowing
for sample rounding), including entry, loops and exit. Check reused reference
code too. On a validation error, rewrite the timing; do not suppress the check.

## Start here

Choose the path before calling a creation or mutation tool:

- **Existing MG** — read [Revise an existing MG](references/revising-existing-mg.md)
  before choosing property, placement or source edits. Reuse accepted style and
  reference evidence for routine revisions.
- **New or substantially redesigned MG** — complete steps 1–3 below before
  writing source: establish the visual direction, browse instances and inspect
  the selected examples. A delegated style choice skips the user picker, not
  reference inspection. If no project style is selected, search instances by
  content or form.
- **Before writing source** — read [Runtime APIs](references/runtime-api.md) in
  full; for text or connected shapes, also read [JSX layout](references/jsx-layout.md)
  in full. Reuse references already read in this conversation when they still apply.

Finish with stored-state and visual evidence: after creating or updating an asset,
use `inspect_asset` to check the saved property schema/defaults, then verify its
timeline placement and composed frames. Tool acceptance alone does not show what
was saved or how it looks.

If `push_asset` returns `status: "reference_review_required"`, no asset was
created. Inspect the returned style spec and concrete examples, revise the local
source where needed, then retry `push_asset` with its entry `filePath`. The examples
are a starting point: search by content or form when they do not fit the graphic's
job. Do not treat a style cover or an instance title as an inspected design.

## Workflow

For new or substantially redesigned MGs, the workflow has five steps. First
understand the overall flow, then read each step's detailed requirements below
in full.

1. **Gather inputs** — inspect project state and target frames; establish the
   content, timing, role and output constraints.
2. **Choose or reuse the Design Style** — preserve the accepted visual direction,
   or browse and confirm a new one with the host’s supported picker.
3. **Inspect instances** — find examples that fit the content, starting with
   the chosen style and searching other styles when a needed form is missing.
   Read the selected instances' design descriptions in full and inspect their
   visuals to identify useful layout, typography and motion ideas.
4. **Author and create the MG** — plan the composition and media layers, then adapt the
   inspected examples to the current content and confirmed Design Style in
   HTML or Remotion source. Import the entry with `push_asset` and its editable
   property schema.
5. **Place and verify** — place the created asset on the timeline when requested,
   and inspect the composed entry, settled state and exit. Verify recurring
   forms before extending them across the edit.

## 1. Gather inputs

Inspect project state when the canvas, fps, current visual language or timeline
relationships are not already known. Inspect representative target frames as
well as the transcript: timing tells you when, while the frame determines form,
placement and background. Reuse decisions already made by the user or scenario
skill.

Identify only the inputs needed for this edit:

- **Placement**: start time, duration, target layer if known, and the target frame the graphic must compose with.
- **Role in the edit**: what job this Motion Graphic performs in the video.
- **Content**: exact text, numbers, media, or visual facts that must appear.
- **Timing**: whether internal motion should sync to speech, music, or a visual event.
- **Visual source**: user-provided style, project Design Style, brand colors/fonts, or an accepted existing Motion Graphic.
- **Editable fields**: which text, colors, numbers, booleans, image, or video values should become properties.

Ask only for missing high-leverage inputs that would materially change the result.

## 2. Choose or reuse the Design Style

Direction is the high-leverage choice — surfacing it before authoring is much
cheaper than reauthoring after.

Use step 1's inputs and follow the scenario skill's visual workflow when provided.
Reuse the project's confirmed Design Style or the user's specified style.
Use `manage_design_style get` to read the selected style's design spec and
reference previews; reuse previously read details that have not changed.
Treat a failed lookup as unknown style state, not as "no style": correct the
reported arguments and retry. If discovery remains unavailable, report that and
ask for a visual direction unless the user has already specified or delegated it.
Routine edits do not require another style choice.
If no direction is confirmed and the user explicitly says "directly do it" or
"do not ask", choose a concrete temporary direction from the content and footage
and continue. Do not save or apply that unconfirmed guess as the project Design Style.

Reference results carry JSON in text content, followed by labeled image blocks;
`get` may prepend a spec summary. When calling tools from code, parse the JSON
text block and forward each image block with the host's image helper instead of
printing the whole result. Use returned `thumbnailUrl` values unchanged for
catalog previews and follow the host's `widget-forms` display contract.

**When the direction remains unspecified or the user requests a new direction,
follow these steps:**

- **Design thinking** — use the context to compare directions without overriding
  the user's stated style. Aim for a distinctive, production-grade and intentional
  result. Maximalist and restrained MGs can both work; the key is intentionality,
  not intensity. A minimal or refined direction still needs a named design
  language and clear intent. Plain/simple/basic is not a Direction.
  Use these considerations, not a fixed style menu:
  - **Purpose**: What does this MG convey? Who watches?
  - **Tone**: Consider specific flavors such as maximalist editorial, vintage newspaper front page, 80s 复古印刷, brutalist / raw, kinetic typography, playful / toy-like, refined / luxury, dark editorial, dark tech aesthetic, cinematic, hand-drawn, editorial pull-quote, NYT infographic, stamp badge, dashboard editorial, frosted glass card, brutally minimal, Apple keynote minimal, pitch deck minimal, etc. Use these as inspiration, not defaults.
  - **Constraints**: Target size for this MG asset, duration, no interaction, Design Style / brand spec (if provided), the video footage it overlays.
  - **Memory**: What is the one idea the viewer should remember after 3 seconds?
- **Find candidates** — gather candidates suited to the content from both sources:
  - **User styles** — inspect saved custom styles with `manage_design_style list`.
  - **Catalog styles** — determine the suitable category from the content's
    language (`cjk` for Chinese, Japanese or Korean; `western` for Western
    languages such as English, French or Italian), then pass it in
    `applicableLanguages` when calling `manage_design_style list_presets`.
    View the returned style collages, following continuation instructions to
    see all pages.
- **Preview and confirm** — read `widget-forms`, then show suitable custom and
  catalog styles together in one widget: 3–6 distinct directions when available,
  real previews, and a short rationale in the user's language. **For any project without a specified MG style,
  you MUST ask the user to choose unless they explicitly delegate the choice**.
  End the turn at the picker and wait before creating assets; a request to
  "create a title" does not itself delegate style choice. Also clarify overlay
  versus fullscreen if unclear.
- **Apply the selected style** — after user confirmation, use
  `manage_design_style apply` for a custom style or `apply_preset` for a catalog
  style.
  When creating a custom style, save its palette, font plan, cover and reference sources.

For both reused and newly selected styles, **use the confirmed spec**: keep its
palette and approved `fonts` for each language/role, including family, weight
and style.
Confirm that the selected fonts load correctly and display all characters in
the current content. For missing fonts or requested typography changes, read
[Font matching](references/font-matching.md).

## 3. Inspect instances

For a new or substantially redesigned MG:

- **Identify useful forms** — use the content and target frames to decide which
  forms are useful; let reference previews refine those choices. Choose
  instances yourself unless the user asks to compare them. Find a fitting
  instance for each needed form; recurring components can reuse an inspected
  one.
- **Find instances** — use `browse_library`, following the chosen Design Style's
  instance lookup guidance:
  - **Within the style** — inspect related members for each needed form.
  - **Across styles** — if a needed form has no fitting member, remove style
    restrictions and style-name search terms, then search the whole instance
    library by content or form. If neither search finds a fit, work from the
    confirmed direction and state the limitation.
- **Inspect selected examples** — choose instances from the search-result cover
  collages, then read each selected instance's full design description and
  inspect its images.
  Follow the tool's continuation guidance; retry or report missing visual evidence.
  - **Visual design** — look at where text and images sit, how headings differ
    from body text, and how much space separates elements.
  - **Materials and composition** — distinguish example photos and copy to replace
    from reusable textures, backgrounds and other production materials. Read the
    instance's material list and usage notes for layer order, filter combinations
    and which media each filter affects.
  - **Motion** — when borrowing animation, compare the same design at different
    timestamps to see how elements enter, move and exit. A static image shows
    the visual appearance but does not reveal the animation sequence.
  - **Fidelity** — identify the details that make the reference recognizable:
    type hierarchy, line quality, material, layering and motion order. Carry
    those into the new content. A hand-drawn annotation needs its irregular
    stroke and reveal, not just a geometric oval; a photographed or textured
    field needs suitable media or material, not an unrelated flat gradient.
    If a required material is unavailable, find a suitable replacement or
    explain the change instead of silently dropping it.
  - **Code, templates and batches** — before borrowing code, reusing/extending
    components or planning a batch, read
    [Instance and template reuse](references/instance-and-template-reuse.md)
    completely. When borrowing code, inspect its implementation and saved
    editable properties; do not infer property defaults from JSX or preview images.

## 4. Author and create the MG

Implement the confirmed Design Style and inspected instance as a composed,
editable MG. Use the existing decisions from steps 1–3. Use the task's text,
numbers and facts; reference labels and data are examples, not additional content.

- **Adapt the design** — borrow useful layout, typography and motion ideas,
  adapting them to the current content, confirmed project fonts, palette,
  materials and target shot. Keep the visual language consistent across the
  video. Design the readable settled frame first, then animate into it. Choose
  how type, geometry, imagery or motion explains the content; do not add filler
  labels or a default wrapper. For a new/substantially redesigned talking-head
  overlay, a cross-style layout or a complex photo/graphic overlay, read
  [Overlay composition](references/overlay-composition.md) before authoring.
- **Honor the style's rules** — implement explicit typography, material and
  motion constraints literally: a hard-cut style must not acquire fades or
  springs. Add textures, glow, grain or other effects only when the confirmed
  style or the graphic's job calls for them; preserve expressive choices as
  well as restrained ones.
- **Choose the natural box and timing** — size an overlay around its full
  animated extent, not just the settled pose. Leave generous transparent padding
  for travel, peak zoom, spring overshoot, strokes, shadows and glows so they do
  not hit the asset edges. Start with roughly 15–20% breathing room around the
  graphics and increase it when the motion needs more; padding is not a substitute
  for checking the largest animated bounds. Keep the box content-sized rather
  than timeline-sized; use timeline dimensions for an intentional full-frame design.
  Match duration, reading time and internal beats to the intended timeline span.
  For speech-synced reveals, read actual transcript/word timestamps before
  authoring and convert them to offsets from the MG's timeline start. Do not
  estimate beats or use absolute timeline frames as local animation frames.
- **Set the background** — for MGs layered over footage or images, follow
  **No Cards / Transparent Background**:
  - Keep direct text/symbol overlays 100% transparent around their graphics;
    do not add generic floating cards, frosted-glass panels or enclosing borders.
  - Preserve intentional layouts, graphic shapes, frames and masks. Media
    windows and cutouts must remain transparent; surrounding graphics may be opaque.
  - Follow explicit user or confirmed style/reference requirements. An opaque
    fullscreen MG owns its background; do not add a fallback solid underneath.
- **Plan media composition when needed** — for photos, footage or other media,
  read [Media and MG composition](references/media-composition.md) before
  authoring. Keep ordinary production media and graphic layers separate;
  embed media when the visual mechanism requires internal rendering.
- **Build editable properties** — expose visible text, primary/accent colors,
  key numbers, font choices and requested controls. Declare stable, matching keys,
  labels, types and defaults; Remotion reads `item.props`, while HTML consumes
  resolved `props` in `mount`/`update`. Do not hardcode editable content.
  Media uses image/video properties containing
  current-project asset IDs; render it only when the value is present.
  Expose a `transparentBackground` boolean when adding a background surface.
- **Use supported fonts and layouts** — keep the confirmed fonts. When choosing
  or replacing a font, use the exact family name of a Google Fonts or project
  custom font in both JSX and the font property; do not depend on a
  machine-specific font.
  For text or connected shapes/symbols, read
  [JSX layout](references/jsx-layout.md) before implementing their layout.
- **Follow the runtime contract** — read [Runtime APIs](references/runtime-api.md)
  before selecting a runtime, libraries or authoring the entry. Choose the runtime
  per graphic: consider the scene structure, animation mechanism and library
  capabilities that simplify the intended design. One project may contain both
  HTML and Remotion assets; a shared visual language does not require one runtime.
  Do not add a library or mix runtimes just to demonstrate usage. HTML exports `mount`;
  Remotion supports JS/JSX and TS/TSX, imports, exports, and relative modules.
  Export exactly one entry component (default or named); supporting modules
  may export helpers. `Sequence`, `Series`, helper components and inline JSX
  expressions are supported. There is no required root tag or component name.
  Make animation deterministic at arbitrary frames, including seeking/export.
  Use Flux's native validation; do not apply Web-only renderer restrictions.
- **Create and inspect the asset** — pass the entry's absolute `filePath`,
  `type: "motion-graphic"`, dimensions and editable property schema to `push_asset`.
  Its `duration` is integer microseconds (3000000 is three seconds). Keep the
  entry and supporting files together; do not delete them after import.
  Use the natural box, name and description established above and follow the
  current tool schema for fields.
  Call `inspect_asset` with the returned `assetId` and verify the saved property
  keys, types and defaults. Creation adds it to the project library; timeline
  placement follows in step 5.

## 5. Place and verify

- **Place the asset** — use `edit_item` with the intended track, timing and
  rectangle, chosen from the subject, captions, visual weight and speech span
  of the actual shot. Do not default to a fixed safe-zone or use fullscreen to
  avoid solving overlay placement. Scale from the asset's natural aspect ratio;
  use full-frame bounds when the design calls for them. If timing changes
  materially, update the MG so entrance, hold and exit complete within the
  placed span rather than truncating unfinished animation.
- **Assemble the layers** — preserve source footage and speech timing unless
  the user requested a replacement edit; put a full-frame visual overlay above
  the footage. Place production media with its planned crop, order, effects
  and timing. A transparent MG's standalone preview omits those external
  layers. Re-read asset and timeline state after mutations.
- **Verify the composed frames** — use `preview_timeline` with the viewer view
  to inspect entry, settled state and exit,
  including the frames with the most visible text and the largest zoom or motion
  excursion. Check that graphics and effects retain breathing room at those
  extremes, unless edge cropping is intentional. Check readability at video
  scale, longer editable copy, clipping, animated bounds, captions when present,
  media crop and effect targets. Inspect nearby frames when a transient state
  could explain an apparent defect; a successful tool call is not verification.
  Report unavailable visual checks rather than claiming they passed.
- **Correct and reuse** — fix placement with timeline edits and internal design
  with JSX/properties. Diagnose invalid payloads or asset readiness before
  retrying. If position and size cannot integrate the graphic with the shot,
  change its form or timing, or omit it. For a batch, compare composed settled
  frames and verify each form in its own shot before extending it.

## Other workflows

- **Generated narration** — when pairing an MG with TTS, voiceover or narration,
  or retiming a narrated sequence, load `voice` and read its
  `references/video-sync.md` relative to the `voice` Skill’s directory before writing the
  script, generating audio, authoring the MG or changing timeline timing.
- **Existing MG changes** — read
  [Revise an existing MG](references/revising-existing-mg.md) before choosing
  the edit scope, tools and verification steps.
- **Convert to video** — read [Convert an MG to video](references/convert-to-video.md)
  before converting an MG into a reusable video asset.
