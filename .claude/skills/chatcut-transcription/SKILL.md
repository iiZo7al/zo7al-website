---
name: transcription
description: Add, fix and polish ChatCut Desktop captions and subtitles with caption tools, published presets, keyword emphasis, grouping, layout, animation and translation. Also covers missing speech transcription, transcript search and explicitly requested source-transcript repair. Use across built-in and connected agents.
---

# Captions and speech transcription

## Start with captions

For “fix these subtitles”, a misspelled caption, punctuation, shorter wording, a new look, emphasis or better line breaks, start with `read_captions` → `edit_captions`. Caption Cards are the editing surface for what viewers read. Use `set_card_text` for caption wording, including spelling corrections, and caption style/layout/grouping tools for presentation. Preserve the source transcript, picture edit and audio unless changing them is part of the request. Do not make a source-transcript audit, source FIX, raw transcript-file edit or re-transcription a prerequisite for caption polish.

Read actual Cards and their owning tracks, choose the narrowest requested scope, apply the edit, then inspect the changed Cards over the footage. Caption wording edits do not update reusable source transcription; source repair is a separate task, not a hidden extra step.

## Adding captions and choosing a style

Use published caption presets as the starting point for a new look, including
animated Motion Graphic presets when they fit the request. For a simple “add
captions” request, enable captions directly using any saved project style
preference; no chooser is required. Apply concrete requested edits directly.
When the user asks to see, compare, or choose styles, read the published
catalog through `edit_captions action:"template"` with the actual caption
`languageCode` in `json`, then load `widget-forms` and show its preview cards
before changing the project. Choose from `publishedTemplates`, including relevant
`kind:"motion-graphic"` entries for expressive or animated requests. The legacy
built-in preset list is not the advertised style-selection catalog.

Copy the published entry's returned `previewOptions`; the embedded widget uses
its `presetId` (`catalog:<UUID>:<languageCode>`), while external forms use its
exact `captionPreview:{kind:"catalog",templateId,revision,languageCode}`. Keep
the requested language and actual timeline/track/Card target. Do not infer IDs
from names or assume preview support is absent without trying the supported
read-only request. Inspect `available` / `unavailableReason` when returned, and
report an unresolved limitation instead of substituting ordinary CSS for MG or
mutating the project to manufacture a preview.

Leave the project unchanged until selection. Follow the selected template's
recorded application/preparation calls for that target and verify its published
identity afterward. Other is a typed customization request; if the user
explicitly requests a new treatment absent from the published catalog, use the
custom template workflow below rather than advertising generated drafts as
published presets.

## Caption refinement

Correct the requested caption wording with `set_card_text`, checking uncertain words against the speech rather than inventing them. Use native punctuation/case/Chinese-script display settings for a systematic display change instead of rewriting every Card. Only if source or clip changes are already part of the task, complete those before final Card polish and reread affected captions afterward.

Choose the caption operation that matches the request:

| Request                                                | Caption tooling                                    |
| ------------------------------------------------------ | -------------------------------------------------- |
| Fix a typo or shorten one subtitle                     | `set_card_text`                                    |
| Natural phrase boundaries                              | `split_card` / `merge_cards` with fresh word IDs   |
| Pick or suppress meaningful keywords                   | `set_card_emphasis`                                |
| Change a track's look without replacing Card overrides | `set_track_style`                                  |
| Style or position one Card                             | `set_card_style` / `set_card_layout`               |
| Position a whole track                                 | `update_track` with `layout`                       |
| Adjust caption timing without cutting media            | `set_card_timing` using project frames             |
| Import an existing subtitle file                       | `import_subtitles`, leaving existing tracks intact |
| Several independent Card tweaks                        | `batch` with one current revision                  |

For a preset change, use the selected published template's application instead
of reconstructing its settings. For a small change to an existing dynamic
preset, use its exposed template properties when available rather than writing
new renderer source. Preserve unrelated Card overrides and locks; an explicit
preset replacement is different from an ordinary style tweak.

Read `read_captions` with `words:true` and use the returned Card and token IDs. Improve sentence grouping with `split_card` and `merge_cards`, then adjust spacing and readable scale with caption style fields and `set_card_layout`. Check long phrases and short isolated words in the real video rather than assuming a maximum line length gives good phrasing. Card/token start and end times are microseconds; frame queries and frame-based placement require conversion using the project frame rate.

Batch a shared baseline style first, then re-read Cards: style changes can regroup them and invalidate old Card IDs. Use `edit_captions {action:"batch",edits:[...]}` for up to 100 ordered synchronous edits with one commit; a failing edit writes nothing. Batch independent Card layouts and styles, including multiple bindings to one template. For example, each binding is `{action:"set_card_style",cardId,style:{template:{path,runtime}},mode:"merge"}`. Do not carry old Card IDs across a regrouping style edit in the same batch. For splitting, pass `{cardId:card.id,beforeTokenId:card.words[n].id}` from a fresh `read_captions` result, choosing a word after the first. Transcript correction locations and caption split boundaries are different contracts.

For keyword selection within the current treatment, use `set_card_emphasis` with `{cardId,spans:[{text:"exact words",emphasis:true}]}`. Use `false` to suppress a poor keyword or `"auto"` to remove that exact override; supply 1-based `occurrence` when text repeats. This preserves text, timing and CSS and is different from active-word styling. Verify `textStyleRanges` with `read_captions words:true`, then inspect the bound template. Do not recreate source-linked Cards as independent subtitles or rewrite a template just to select keywords.

## Custom treatments beyond the catalog

For a requested treatment that the published presets and exposed controls do
not supply, or a revision to existing custom source, load `caption-template-impl`.
Author and revise reusable source directly in the main agent, keep it in a
persistent project-owned directory, and bind it with `set_card_style` and
`style.template:{path,runtime,properties?}`. Do not delegate caption creation or
register the template as a library asset. Use actual short/long phrases and
word timings; make custom motion serve the spoken meaning while keeping other
captions readable. The `template` catalog action does not create custom source.

`template:null` chooses ordinary captions; omitting it in a merge preserves an
existing binding. To restore Card inheritance, replace its style with the
remaining intended fields and omit `template`.

Inspect representative **bound Cards** over the actual footage, including word changes and Card boundaries. A standalone MG preview or a successfully saved source reference does not validate caption rendering. Verify requested wording, grouping, spacing, text visibility, subject clearance, and emphasis across the edited scope. Reopen/read the saved project to check persistence, and inspect the requested export before claiming the refined video is finished.

## Caption Translation

Read `read_captions` first. Its `captions.tracks` includes hidden tracks and
identifies originals and translations with `role`, `contentLanguageCodes`, and
`sourceTrackId`. A null track-level `languageCode` does not mean the original
text is missing; use `contentLanguageCodes` to identify its language.

To restore existing original or bilingual subtitles, pass the hidden track's
returned `showAction` directly to `edit_captions`. To hide a language, use
`action: "track"` with its exact `trackId` and `visible: false`. Use `enable`
first only if `captions.visible` is false. Verify the resulting track visibility
with `read_captions`.

Use `edit_captions` action `translate` only to create or update a translation
in a language the user requested. Do not use translation to restore visibility,
invent a target language, or create a temporary translation and hide it.
Enable captions if none exist, then pass the requested target language in `json`:

```json
{
  "action": "translate",
  "json": "{\"languageCode\":\"es\",\"mode\":\"bilingual\"}"
}
```

This creates or updates a separate translation track. `mode` defaults to
`bilingual`; use `translation` to hide the source captions and show the translation.
Optional `trackId` in the payload selects a source caption track or its source
media track by id/prefix; omit it to translate visible source tracks and sources
with a visible translation in the target language.
Use `set_card_text` for individual wording corrections after translation.
For a correction intended to update the reusable saved translation across its
bound captions, read `translationSources:true` and use `set_translation_text`.

## Missing transcription and explicit source repair

Existing captions can be edited without starting recognition. When caption
coverage actually lacks the speech needed for the task, inspect `browse_assets`
or `inspect_asset` for the source, accepted transcript and active request.
Reuse accepted text and wait for existing work; an empty accepted transcript,
missing text, a failed attempt and a source with no audio are different facts.

Use `trigger_transcript` only for needed speech sources. It selects recognition
by language and uploads the full source's first audio stream; wait with
`track_progress target:"transcription" action:"wait"`. Reads and visibility
changes never start recognition. Skip instrumental music, effects, silent
visuals and unrelated sources. Do not install a local ASR engine or bypass a
local-only/no-upload restriction.

Only for an explicit request to repair the shared source transcript, speaker
assignments, or import an existing user transcript, read
[source transcript maintenance](references/source-transcripts.md). This is not
the default caption-editing route.

## Progress and recovery

Use the actual attempt's progress and error. A wait timeout does not imply that execution failed; cancelling the wait does not cancel transcription. A failed or interrupted request can be started explicitly again. Opening a project only reattaches work that has a matching existing service job; it does not create a new paid request from an old pending flag. Transcript publication detects changed sources and concurrent text edits; stale results never replace accepted content.

`read_captions` includes source coverage, including when no caption item exists. Use that to distinguish missing/stale transcription from an empty recognized result or a selected clip outside speech. Do not infer absence of speech from missing text.

If captions read back as empty, check the source-time range of the timeline clip. A transcript can be ready while the current visible clip starts before the first spoken word; add or trim a clip so the transcribed source words fall inside the timeline range, then extend/update the captions item duration if needed.

Use the raw tools when you need finer control:

- `track_progress` with `target: "transcription"` for status/wait.
- `find_transcript` for query-based transcript lookup.
- `read_captions` and `edit_captions` for caption display edits.
- `clean_script` for mechanical timeline playback cleanup of fixed fillers and batch pauses after transcript-ready media is on the timeline.

When a transcript-ready request becomes an editorial talking-head edit, follow the public-safe talking-head workflow in shared `talking-head-guide`. In short: use `clean_script` only for mechanical cleanup, then use Script (`read_script` -> edit `timeline.md` -> `apply_script`) for semantic repeated-take, silence, filler, or coherence edits, and verify the resulting script rather than trusting tool success alone.
